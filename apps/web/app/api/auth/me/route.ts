import { NextResponse } from 'next/server';
import { getTenantSession } from '../../../../lib/auth/get-tenant-session';

export async function GET() {
  const session = await getTenantSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  // Attempt to fetch fresh workspace data from Fastify backend
  let freshWorkspace: any = null;
  try {
    const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${API_BASE}/api/admin/workspaces/${session.workspaceId}`, {
      headers: {
        'x-user-role': session.role,
        'x-workspace-id': session.workspaceId
      },
      cache: 'no-store'
    });
    if (res.ok) {
      freshWorkspace = await res.json();
    }
  } catch (e) {
    // Ignore if backend offline
  }

  const subscriptionStatus = session.role === 'superadmin' 
    ? 'active' 
    : (freshWorkspace?.subscriptionStatus || session.subscriptionStatus || 'pending_payment');
  const subscriptionPlan = freshWorkspace?.subscriptionPlan || session.subscriptionPlan || 'pro';
  const trialEndsAt = freshWorkspace?.trialEndsAt ? new Date(freshWorkspace.trialEndsAt).getTime() : session.trialEndsAt;
  const currentPeriodEnd = freshWorkspace?.currentPeriodEnd ? new Date(freshWorkspace.currentPeriodEnd).getTime() : session.currentPeriodEnd;

  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      workspaceId: session.workspaceId
    },
    workspace: {
      id: session.workspaceId,
      name: freshWorkspace?.name || 'CRDISK Enterprise',
      slug: freshWorkspace?.slug || 'crdisk',
      status: freshWorkspace?.status || 'active',
      subscriptionStatus,
      subscriptionPlan,
      trialEndsAt,
      currentPeriodEnd
    }
  });
}
