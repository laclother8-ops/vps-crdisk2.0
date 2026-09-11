/**
 * Automated Verification Test Suite for Multi-tenant Workspaces & RBAC
 * Run via: npx tsx apps/api/test_multitenant_rbac.ts
 */

const API_BASE = 'http://localhost:4000';

async function request(endpoint: string, options: any = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Iniciando Testes Automatizados de Multi-tenancy & RBAC...\n');
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
    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200, 'Health check online');

    // 2. Superadmin: Login and Global Metrics
    console.log('\n--- 1. Autenticação & Superadmin ---');
    const superLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'adm', password: '052115wW@' })
    });
    assert(superLogin.status === 200 && superLogin.data.user.role === 'superadmin', 'Login do Superadmin master com sucesso');

    const superHeaders = {
      'x-user-role': 'superadmin',
      'x-workspace-id': '11111111-1111-1111-1111-111111111111'
    };

    const metrics = await request('/api/admin/workspaces/metrics', { headers: superHeaders });
    assert(metrics.status === 200 && metrics.data.totalWorkspaces >= 3, 'Superadmin acessa métricas globais da plataforma');

    const workspacesList = await request('/api/admin/workspaces', { headers: superHeaders });
    const wsArray = workspacesList.data.data || workspacesList.data || [];
    assert(workspacesList.status === 200 && wsArray.length >= 3, 'Superadmin lista todos os workspaces');

    // 3. Create a New Tenant Workspace with Admin User
    console.log('\n--- 2. Criação de Novo Workspace (Tenant) ---');
    const newWsData = {
      name: `Empresa Alpha ${Date.now()}`,
      slug: `alpha-${Date.now()}`,
      adminName: 'Juliana Gestora',
      adminEmail: `juliana-${Date.now()}@alpha.com`,
      adminPassword: 'password123'
    };
    const createWs = await request('/api/admin/workspaces', {
      method: 'POST',
      headers: superHeaders,
      body: JSON.stringify(newWsData)
    });
    const createdWs = createWs.data?.workspace || createWs.data;
    const createdAdmin = createWs.data?.adminUser;
    assert(createWs.status === 201 && createdWs?.id && createdAdmin?.id, 'Superadmin cria novo workspace e admin inicial com sucesso', createWs);
    const createdWsId = createdWs?.id || '11111111-2222-2222-2222-222222222222';

    // 4. RBAC: Workspace Admin operations
    console.log('\n--- 3. Permissões de Workspace Admin (RBAC) ---');
    const wsAdminHeaders = {
      'x-user-role': 'workspace_admin',
      'x-workspace-id': createdWsId
    };

    // Workspace admin CAN list and manage their team
    const teamList = await request('/api/team/users', { headers: wsAdminHeaders });
    assert(teamList.status === 200 && (teamList.data.users?.length >= 1 || Array.isArray(teamList.data)), 'Workspace Admin lista membros do seu workspace', teamList);

    // Workspace admin creates an operator
    const newOperator = await request('/api/team/users', {
      method: 'POST',
      headers: wsAdminHeaders,
      body: JSON.stringify({
        name: 'Marcos Operador',
        email: `marcos-${Date.now()}@alpha.com`,
        password: 'password123',
        role: 'operator'
      })
    });
    assert(newOperator.status === 201 && newOperator.data.role === 'operator', 'Workspace Admin cadastra operador na sua equipe');
    const operatorId = newOperator.data.id;

    // Workspace admin resets operator's password
    const resetPass = await request(`/api/team/users/${operatorId}/reset-password`, {
      method: 'POST',
      headers: wsAdminHeaders,
      body: JSON.stringify({ newPassword: 'new-secure-password-123' })
    });
    assert(resetPass.status === 200 && resetPass.data.success, 'Workspace Admin redefine senha de operador');

    // Workspace admin CANNOT access Superadmin endpoints (403 Forbidden)
    const adminBlocked = await request('/api/admin/workspaces', { headers: wsAdminHeaders });
    assert(adminBlocked.status === 403, 'Workspace Admin é bloqueado (403 Forbidden) ao tentar acessar /api/admin/workspaces');

    // 5. RBAC: Operator restrictions
    console.log('\n--- 4. Restrições do Operador (403 Forbidden) ---');
    const operatorHeaders = {
      'x-user-role': 'operator',
      'x-workspace-id': createdWsId
    };

    // Operator CANNOT access team management
    const operatorTeamBlocked = await request('/api/team/users', { headers: operatorHeaders });
    assert(operatorTeamBlocked.status === 403, 'Operador é bloqueado (403 Forbidden) ao tentar acessar /api/team/users');

    // Operator CANNOT access admin workspaces
    const operatorAdminBlocked = await request('/api/admin/workspaces', { headers: operatorHeaders });
    assert(operatorAdminBlocked.status === 403, 'Operador é bloqueado (403 Forbidden) ao tentar acessar /api/admin/workspaces');

    // 6. Superadmin Impersonation
    console.log('\n--- 5. Personificação (Impersonate) pelo Superadmin ---');
    const impersonate = await request(`/api/admin/workspaces/${createdWsId}/impersonate`, {
      method: 'POST',
      headers: superHeaders,
      body: JSON.stringify({})
    });
    assert(impersonate.status === 200 && (impersonate.data.isImpersonating || impersonate.data.success || impersonate.data.targetWorkspace), 'Superadmin gera sessão de personificação', impersonate);

    // Test /me endpoint with impersonation context
    const impersonatedMe = await request('/api/auth/me', {
      headers: {
        'x-user-role': 'superadmin',
        'x-workspace-id': createdWsId,
        'x-impersonating': 'true'
      }
    });
    assert(impersonatedMe.status === 200 && impersonatedMe.data.workspace?.id === createdWsId, '/api/auth/me identifica corretamente o workspace no contexto', impersonatedMe);

    console.log(`\n========================================`);
    console.log(`RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM COM SUCESSO!`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Erro na execução dos testes:', err);
  }
}

runTests();
