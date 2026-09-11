import { NextRequest, NextResponse } from 'next/server';
import { getTenantSession, createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '../../../../lib/auth/get-tenant-session';
import { cookies } from 'next/headers';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(req: NextRequest) {
  try {
    const session = await getTenantSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Check fresh workspace status from Fastify API
    let workspaceData: any = null;
    try {
      const res = await fetch(`${API_BASE}/api/admin/workspaces/${session.workspaceId}`, {
        headers: {
          'x-user-role': session.role,
          'x-workspace-id': session.workspaceId
        },
        cache: 'no-store'
      });
      if (res.ok) {
        workspaceData = await res.json();
      }
    } catch (e) {
      // Fallback
    }

    const currentStatus = session.role === 'superadmin' 
      ? 'active' 
      : (workspaceData?.subscriptionStatus || session.subscriptionStatus || 'pending_payment');
    const currentPlan = workspaceData?.subscriptionPlan || session.subscriptionPlan || 'pro';
    const trialEndsAt = workspaceData?.trialEndsAt ? new Date(workspaceData.trialEndsAt).getTime() : session.trialEndsAt;
    const currentPeriodEnd = workspaceData?.currentPeriodEnd ? new Date(workspaceData.currentPeriodEnd).getTime() : session.currentPeriodEnd;

    const isTrialValid = currentStatus === 'trial' && (!trialEndsAt || Date.now() < trialEndsAt);
    const isUnlocked = currentStatus === 'active' || isTrialValid;

    // If status changed to active in backend, update session cookie
    if (currentStatus === 'active' && session.subscriptionStatus !== 'active') {
      const updatedToken = createSessionToken({
        ...session,
        subscriptionStatus: 'active',
        subscriptionPlan: currentPlan,
        currentPeriodEnd
      });

      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, updatedToken, SESSION_COOKIE_OPTIONS);
      cookieStore.set('crdisk_token', updatedToken, SESSION_COOKIE_OPTIONS);
    }

    return NextResponse.json({
      workspaceId: session.workspaceId,
      workspaceName: workspaceData?.name || 'Workspace',
      subscriptionStatus: currentStatus,
      subscriptionPlan: currentPlan,
      isUnlocked,
      trialEndsAt,
      currentPeriodEnd,
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Billing Status Error]', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status da assinatura' },
      { status: 500 }
    );
  }
}
