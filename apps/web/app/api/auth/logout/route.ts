import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '../../../../lib/auth/get-tenant-session';

export async function POST() {
  const cookieStore = cookies();

  // Expire cookies immediately with matching security flags
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0
  });

  cookieStore.set('crdisk_token', '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0
  });

  return NextResponse.json({
    success: true,
    message: 'Sessão encerrada com sucesso.'
  });
}
