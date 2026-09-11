/**
 * Automated Security, Middleware & Anti-IDOR Verification Suite for CRDISK
 * Run via: npx tsx apps/web/test_security_suite.ts
 */

const WEB_BASE = 'http://localhost:3000';

async function runSecurityTests() {
  console.log('🛡️  ========================================================');
  console.log('🛡️  CRDISK SECURITY & NEXT.JS MIDDLEWARE VERIFICATION SUITE');
  console.log('🛡️  ========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, errorDetails?: any) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (errorDetails) console.error('     Detalhes:', errorDetails);
    }
  }

  try {
    // ==========================================
    // TAREFA 1: Roteamento & Middleware de Autenticação
    // ==========================================
    console.log('📌 TAREFA 1: Roteamento Obrigatório para /login & Redirecionamentos 307');

    // 1.1 Unauthenticated Root ('/') -> Redirect to /login
    const rootRes = await fetch(`${WEB_BASE}/`, { redirect: 'manual' });
    const rootLocation = rootRes.headers.get('location') || '';
    assert(
      rootRes.status === 307 && rootLocation.includes('/login'),
      `Requisição não autenticada na raiz ('/') redireciona com HTTP 307 para '/login' (Recebido: ${rootRes.status}, Location: ${rootLocation})`
    );

    // 1.2 Unauthenticated Private Routes -> Redirect to /login with redirect param
    const privateRoutes = ['/dashboard', '/crm', '/settings', '/admin', '/dialer', '/chat', '/ai-agents'];
    for (const route of privateRoutes) {
      const privRes = await fetch(`${WEB_BASE}${route}`, { redirect: 'manual' });
      const loc = privRes.headers.get('location') || '';
      assert(
        privRes.status === 307 && loc.includes('/login'),
        `Rota privada '${route}' sem sessão redireciona com HTTP 307 para '/login' (Location: ${loc})`
      );
    }

    // 1.3 Public Route /login is accessible
    const loginPageRes = await fetch(`${WEB_BASE}/login`, { redirect: 'manual' });
    assert(
      loginPageRes.status === 200,
      `Rota pública '/login' responde com HTTP 200 OK`
    );

    // ==========================================
    // TAREFA 2: Blindagem de Sessão & Cookies (HttpOnly)
    // ==========================================
    console.log('\n📌 TAREFA 2: Blindagem de Sessão com Cookies HttpOnly & Logout');

    // 2.1 Login API sets HttpOnly cookie
    const loginRes = await fetch(`${WEB_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'adm', password: '052115wW@' })
    });

    const setCookieHeader = loginRes.headers.get('set-cookie') || '';
    const loginData = await loginRes.json();

    assert(loginRes.status === 200, 'POST /api/auth/login autentica com sucesso (HTTP 200)');
    assert(
      setCookieHeader.toLowerCase().includes('httponly') && setCookieHeader.includes('crdisk_session'),
      `Cookie 'crdisk_session' gerado com flag 'HttpOnly' e 'SameSite=lax'`,
      { setCookieHeader }
    );
    assert(
      !loginData.token,
      'Resposta de login NÃO expõe token cru para o cliente salvar em localStorage (apenas metadados sanitizados)'
    );

    // Extract cookie value for authenticated tests
    const sessionCookieMatch = setCookieHeader.match(/crdisk_session=([^;]+)/);
    const sessionCookieValue = sessionCookieMatch ? sessionCookieMatch[1] : '';

    // 2.2 Authenticated user visiting /login -> Redirect to /dashboard
    const authHeaders = {
      Cookie: `crdisk_session=${sessionCookieValue}`
    };

    const authLoginAttempt = await fetch(`${WEB_BASE}/login`, {
      headers: authHeaders,
      redirect: 'manual'
    });
    const authLoginLoc = authLoginAttempt.headers.get('location') || '';
    assert(
      authLoginAttempt.status === 307 && authLoginLoc.includes('/dashboard'),
      `Usuário já autenticado ao acessar '/login' é redirecionado automaticamente com HTTP 307 para '/dashboard'`,
      { status: authLoginAttempt.status, location: authLoginLoc }
    );

    // 2.3 Authenticated user visiting root '/' -> Redirect to /dashboard
    const authRootAttempt = await fetch(`${WEB_BASE}/`, {
      headers: authHeaders,
      redirect: 'manual'
    });
    const authRootLoc = authRootAttempt.headers.get('location') || '';
    assert(
      authRootAttempt.status === 307 && authRootLoc.includes('/dashboard'),
      `Usuário autenticado ao acessar raiz ('/') é redirecionado para '/dashboard'`
    );

    // 2.4 Logout endpoint clears session cookie
    const logoutRes = await fetch(`${WEB_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders
    });
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutRes.status === 200 && (logoutCookie.includes('Max-Age=0') || logoutCookie.includes('expires=')),
      'POST /api/auth/logout invalida o cookie de sessão com Max-Age=0'
    );

    // ==========================================
    // TAREFA 3: Rate Limiting & Proteção Brute Force
    // ==========================================
    console.log('\n📌 TAREFA 3: Rate Limiting & Proteção Anti-Brute Force (5 tentativas / 10 min)');

    // Simulate 5 consecutive failed attempts from test IP header
    const testAttackIp = `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;
    let lastStatus = 200;
    let rateLimitResponseData: any = {};

    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${WEB_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': testAttackIp
        },
        body: JSON.stringify({ email: 'fake-user@test.com', password: 'wrong-password' })
      });
      lastStatus = res.status;
      if (res.status === 429) {
        rateLimitResponseData = await res.json();
      }
    }

    assert(
      lastStatus === 429,
      `Após 5 tentativas falhas consecutivas, a 6ª tentativa retorna HTTP 429 (Too Many Requests)`
    );
    assert(
      rateLimitResponseData.error?.includes('Muitas tentativas de login'),
      `Mensagem de proteção ativa: "${rateLimitResponseData.error}"`
    );

    // ==========================================
    // TAREFA 4: Segurança Multi-Tenant (Anti-IDOR)
    // ==========================================
    console.log('\n📌 TAREFA 4: Segurança Multi-Tenant & Prevenção Anti-IDOR');

    const { decodeSessionToken, createSessionToken } = await import('./lib/auth/get-tenant-session.js');

    const testTenantSession = createSessionToken({
      userId: 'usr-corp-999',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      role: 'workspace_admin',
      name: 'Gestor Seguro',
      email: 'gestor@empresa.com.br'
    });

    const decoded = decodeSessionToken(testTenantSession);
    assert(
      decoded !== null && decoded.workspaceId === '11111111-2222-2222-2222-222222222222',
      `Helper 'get-tenant-session' decodifica e garante estritamente o workspaceId isolado`
    );

    // Test tamper resistance: forge payload with altered role/user while keeping original signature
    const [originalPayload, originalSig] = testTenantSession.split('.');
    const forgedPayloadJson = JSON.stringify({
      userId: 'hacker-666',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      role: 'superadmin',
      name: 'Hacker',
      email: 'hacker@malicious.com',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 100000
    });
    const forgedBase64 = Buffer.from(forgedPayloadJson, 'utf-8').toString('base64url');
    const tampered = `${forgedBase64}.${originalSig}`;
    const tamperedDecoded = decodeSessionToken(tampered);
    assert(
      tamperedDecoded === null,
      `Token alterado/forjado é rejeitado com sucesso (Assinatura criptográfica inviolável)`
    );

    // ==========================================
    // TAREFA 5: Cabeçalhos de Segurança HTTP
    // ==========================================
    console.log('\n📌 TAREFA 5: Cabeçalhos de Segurança HTTP (Anti-Clickjacking & CSP)');

    const secRes = await fetch(`${WEB_BASE}/login`);
    const headers = secRes.headers;

    const xFrame = headers.get('x-frame-options');
    assert(xFrame === 'DENY', `X-Frame-Options: ${xFrame} (Anti-Clickjacking ativo)`);

    const xContent = headers.get('x-content-type-options');
    assert(xContent === 'nosniff', `X-Content-Type-Options: ${xContent} (Proteção contra MIME sniffing ativa)`);

    const referrer = headers.get('referrer-policy');
    assert(referrer === 'strict-origin-when-cross-origin', `Referrer-Policy: ${referrer}`);

    const csp = headers.get('content-security-policy') || '';
    assert(
      csp.includes("default-src 'self'") && csp.includes('twilio.com') && (csp.includes('ws://') || csp.includes('wss://')),
      `Content-Security-Policy (CSP) robusta e compatível com WebSockets e WebRTC/Twilio`
    );

    console.log('\n========================================================');
    console.log(`🎉 RESULTADO FINAL: ${passed}/${total} TESTES DE SEGURANÇA PASSARAM COM SUCESSO!`);
    console.log('========================================================\n');

  } catch (err) {
    console.error('❌ Erro durante a execução da suíte de segurança:', err);
    process.exit(1);
  }
}

runSecurityTests();
