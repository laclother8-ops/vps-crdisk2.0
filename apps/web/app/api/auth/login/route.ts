import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkLoginRateLimit, resetLoginRateLimit } from '../../../../lib/auth/rate-limiter';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '../../../../lib/auth/get-tenant-session';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  // 1. Extract client IP for Rate Limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

  // 2. Rate Limiting Check (5 attempts / 10 min)
  const rateLimit = checkLoginRateLimit(clientIp, 5, 10 * 60 * 1000);
  if (!rateLimit.isAllowed) {
    return NextResponse.json(
      { 
        error: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
        retryAfter: rateLimit.retryAfterSeconds
      },
      { 
        status: 429,
        headers: {
          'Retry-After': rateLimit.retryAfterSeconds.toString()
        }
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, username, password } = body;
    const loginIdentifier = (email || username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!loginIdentifier || !cleanPassword) {
      return NextResponse.json(
        { error: 'Informe o usuário/e-mail e a senha.' },
        { status: 400 }
      );
    }

    let authUser: any = null;
    let authWorkspace: any = null;

    // 3. Authenticate with backend Fastify API
    try {
      const apiRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginIdentifier, username: loginIdentifier, password: cleanPassword })
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        authUser = data.user;
        authWorkspace = data.workspace;
      }
    } catch (e) {
      console.warn('[Auth Route] Fastify backend unreachable, evaluating master fallback:', e);
    }

    // Master Admin fallback if offline
    if (!authUser && (loginIdentifier === 'adm' || loginIdentifier === 'admin' || loginIdentifier === 'adm@crdisk.com.br') && cleanPassword === '052115wW@') {
      authUser = {
        id: 'superadmin-master',
        name: 'Master Admin (CRDISK)',
        email: 'adm@crdisk.com.br',
        role: 'superadmin',
        workspaceId: '11111111-1111-1111-1111-111111111111',
        status: 'active'
      };
      authWorkspace = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'CRDISK Enterprise',
        slug: 'crdisk'
      };
    }

    if (!authUser) {
      return NextResponse.json(
        { 
          error: 'Credenciais inválidas. Verifique seu usuário/e-mail e senha.',
          remainingAttempts: rateLimit.remaining
        },
        { status: 401 }
      );
    }

    // 4. Reset rate limit on successful authentication
    resetLoginRateLimit(clientIp);

    // 5. Generate secure session payload with subscription details
    const subscriptionStatus = authUser.role === 'superadmin' 
      ? 'active' 
      : (authWorkspace?.subscriptionStatus || 'pending_payment');
    const subscriptionPlan = authWorkspace?.subscriptionPlan || authWorkspace?.plan || 'pro';
    const trialEndsAt = authWorkspace?.trialEndsAt ? new Date(authWorkspace.trialEndsAt).getTime() : null;
    const currentPeriodEnd = authWorkspace?.currentPeriodEnd ? new Date(authWorkspace.currentPeriodEnd).getTime() : null;

    const sessionToken = createSessionToken({
      userId: authUser.id,
      workspaceId: authUser.workspaceId || authWorkspace?.id || '11111111-1111-1111-1111-111111111111',
      role: authUser.role || 'workspace_admin',
      name: authUser.name,
      email: authUser.email,
      subscriptionStatus,
      subscriptionPlan,
      trialEndsAt,
      currentPeriodEnd
    });

    // 6. Set HTTP-Only Secure Cookie
    const cookieStore = cookies();
    
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

    // Also set crdisk_token for backward compatibility
    cookieStore.set('crdisk_token', sessionToken, SESSION_COOKIE_OPTIONS);

    // 7. Return sanitized response (WITHOUT exposing raw secret token in body)
    return NextResponse.json({
      success: true,
      message: 'Autenticado com sucesso',
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        workspaceId: authUser.workspaceId
      },
      workspace: authWorkspace ? {
        ...authWorkspace,
        subscriptionStatus,
        subscriptionPlan,
        trialEndsAt,
        currentPeriodEnd
      } : {
        id: authUser.workspaceId || '11111111-1111-1111-1111-111111111111',
        name: 'CRDISK Enterprise',
        subscriptionStatus,
        subscriptionPlan,
        trialEndsAt,
        currentPeriodEnd
      }
    });
  } catch (error: any) {
    console.error('[Auth API] Unhandled error during login:', error);
    return NextResponse.json(
      { error: 'Erro interno durante a autenticação.' },
      { status: 500 }
    );
  }
}
