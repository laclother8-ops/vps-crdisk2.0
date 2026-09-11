import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000';
const MATRIZ_WS = '11111111-1111-1111-1111-111111111111';
const ALPHA_WS = '11111111-2222-2222-2222-222222222222';

async function runCRMTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 CRDISK CRM PIPELINE & LEAD DRAWER VERIFICATION SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  try {
    // 1. Test Leads List for CRDISK Matriz
    console.log('📌 TAREFA 1: Listagem de Leads Multi-tenant e Isolamento de Workspace');
    const resMatriz = await fetch(`${API_BASE}/api/crm/leads?workspaceId=${MATRIZ_WS}`, {
      headers: { 'x-workspace-id': MATRIZ_WS }
    });
    const dataMatriz = await resMatriz.json() as any;
    assert(resMatriz.status === 200, 'Endpoint GET /api/crm/leads responde com HTTP 200');
    assert(Array.isArray(dataMatriz.data), 'Lista de leads retornada em formato array');
    assert(dataMatriz.data.length >= 6, `Leads da Matriz populados com seed (${dataMatriz.data.length} leads encontrados)`);
    
    // Check stages present
    const stagesInMatriz = new Set(dataMatriz.data.map((l: any) => (l.funnelStage || '').toUpperCase().replace(/[^A-Z0-9]/g, '')));
    assert(stagesInMatriz.has('NOVOLEAD'), 'Etapa Novo Lead presente na Matriz');
    assert(stagesInMatriz.has('QUALIFICACAO'), 'Etapa Em Qualificação presente na Matriz');
    assert(stagesInMatriz.has('PROPOSTA'), 'Etapa Proposta Enviada presente na Matriz');
    assert(stagesInMatriz.has('FOLLOWUPATIVO'), 'Etapa Follow-up Ativo presente na Matriz');
    assert(stagesInMatriz.has('FECHADOGANHO'), 'Etapa Fechado / Ganho presente na Matriz');
    assert(stagesInMatriz.has('PERDIDO'), 'Etapa Perdido presente na Matriz');

    // 2. Test Tenant Isolation for Cliente Alpha
    const resAlpha = await fetch(`${API_BASE}/api/crm/leads?workspaceId=${ALPHA_WS}`, {
      headers: { 'x-workspace-id': ALPHA_WS }
    });
    const dataAlpha = await resAlpha.json() as any;
    assert(resAlpha.status === 200, 'Endpoint GET /api/crm/leads para Cliente Alpha responde com HTTP 200');
    assert(dataAlpha.data.length >= 5, `Leads do Cliente Alpha isolados (${dataAlpha.data.length} leads)`);
    const allBelongToAlpha = dataAlpha.data.every((l: any) => l.workspaceId === ALPHA_WS || l.orgId === ALPHA_WS);
    assert(allBelongToAlpha, 'Todos os leads do Cliente Alpha pertencem estritamente ao workspace correto');

    // 3. Test Drag and Drop Stage Update (Funnel Stage Mutation)
    console.log('\n📌 TAREFA 2: Drag and Drop & Atualização de Etapas do Funil');
    const leadToMove = dataMatriz.data[0];
    const originalStage = leadToMove.funnelStage;
    const targetStage = 'FOLLOWUP_ATIVO';

    const resMove = await fetch(`${API_BASE}/api/crm/leads/${leadToMove.id}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': MATRIZ_WS
      },
      body: JSON.stringify({ funnelStage: targetStage })
    });
    const movedLead = await resMove.json() as any;
    assert(resMove.status === 200, 'Atualização de etapa PATCH /api/crm/leads/:id/stage responde com HTTP 200');
    assert(movedLead.funnelStage === targetStage, `Etapa alterada com sucesso para ${targetStage}`);

    // Revert stage back
    await fetch(`${API_BASE}/api/crm/leads/${leadToMove.id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-workspace-id': MATRIZ_WS },
      body: JSON.stringify({ funnelStage: originalStage })
    });

    // 4. Test Lead Drawer: Unified Chronological Timeline
    console.log('\n📌 TAREFA 3: Gaveta de Detalhes do Lead & Timeline Unificada');
    const resTimeline = await fetch(`${API_BASE}/api/crm/leads/${leadToMove.id}/timeline`, {
      headers: { 'x-workspace-id': MATRIZ_WS }
    });
    const dataTimeline = await resTimeline.json() as any;
    assert(resTimeline.status === 200, 'Endpoint GET /api/crm/leads/:id/timeline responde com HTTP 200');
    assert(Array.isArray(dataTimeline.timeline), 'Timeline retornada em formato array cronológico');

    // 5. Test Adding Internal Note
    console.log('\n📌 TAREFA 4: Adição de Nota Interna Rápida pelo Operador');
    const noteContent = 'Anotação de teste automatizado: cliente solicitou proposta formal com condições especiais.';
    const resNote = await fetch(`${API_BASE}/api/crm/leads/${leadToMove.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': MATRIZ_WS
      },
      body: JSON.stringify({ content: noteContent, authorName: 'Master Admin (CRDISK)' })
    });
    const dataNote = await resNote.json() as any;
    assert(resNote.status === 201, 'Endpoint POST /api/crm/leads/:id/notes responde com HTTP 201 Created');
    assert(dataNote.content === noteContent, 'Conteúdo da nota gravado com exatidão');

    // Verify note is now in timeline
    const resTimelineAfter = await fetch(`${API_BASE}/api/crm/leads/${leadToMove.id}/timeline`, {
      headers: { 'x-workspace-id': MATRIZ_WS }
    });
    const dataTimelineAfter = await resTimelineAfter.json() as any;
    const noteFound = dataTimelineAfter.timeline.some((item: any) => item.type === 'note' && item.content === noteContent);
    assert(noteFound, 'Nova nota inserida aparece imediatamente na timeline unificada do lead');

    // 6. Test AI Agent Toggle (Pausar / Retomar Automações)
    console.log('\n📌 TAREFA 5: Toggle Agente IA Ativo / Atendimento Humano');
    const resToggleAI = await fetch(`${API_BASE}/api/chat/conversations/${leadToMove.id}/human-mode`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': MATRIZ_WS
      },
      body: JSON.stringify({ isHuman: true })
    });
    assert(resToggleAI.status === 200, 'Toggle para Atendimento Humano responde com HTTP 200');

    const resToggleAI2 = await fetch(`${API_BASE}/api/chat/conversations/${leadToMove.id}/human-mode`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': MATRIZ_WS
      },
      body: JSON.stringify({ isHuman: false })
    });
    assert(resToggleAI2.status === 200, 'Toggle para Agente IA Ativo responde com HTTP 200');

    console.log('\n========================================================');
    console.log(`🏁 RESULTADO: ${passed} PASSOU / ${failed} FALHOU (Total: ${passed + failed})`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro na execução dos testes:', err);
    process.exit(1);
  }
}

runCRMTests();
