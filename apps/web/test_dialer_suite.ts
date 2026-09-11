import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000';
const MATRIZ_WS = '11111111-1111-1111-1111-111111111111';

async function runDialerTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 CRDISK SOFTPHONE & POWER DIALER VERIFICATION SUITE');
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
    // 1. Test WebRTC Token Generation
    console.log('📌 TAREFA 1: Geração de Token WebRTC & Abstração SIP/Twilio');
    const resToken = await fetch(`${API_BASE}/api/telephony/token?identity=operator-1001`);
    const tokenData = await resToken.json() as any;
    assert(resToken.status === 200, 'Endpoint GET /api/telephony/token responde com HTTP 200');
    assert(typeof tokenData.token === 'string' && tokenData.token.length > 0, 'Token JWT de WebRTC gerado com sucesso');
    assert(tokenData.identity === 'operator-1001', 'Identidade do operador associada ao token SIP');

    // 2. Test Outbound Call Initiation (WebRTC Dial)
    console.log('\n📌 TAREFA 2: Disparo de Chamada Outbound (WebRTC Softphone)');
    const resLeads = await fetch(`${API_BASE}/api/crm/leads?workspaceId=${MATRIZ_WS}`);
    const leadsData = await resLeads.json() as any;
    const testLead = leadsData.data[0];

    const resDial = await fetch(`${API_BASE}/api/telephony/calls/dial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: testLead.id })
    });
    const callData = await resDial.json() as any;
    assert(resDial.status === 200, 'Endpoint POST /api/telephony/calls/dial responde com HTTP 200');
    assert(callData.leadId === testLead.id, 'Chamada vinculada com precisão ao lead alvo');
    assert(callData.id.startsWith('call-'), 'ID de chamada gerado com prefixo padronizado');

    // 3. Test Transferring Call
    console.log('\n📌 TAREFA 3: Transferência de Chamada WebRTC (Blind / Warm Transfer)');
    const resTransfer = await fetch(`${API_BASE}/api/telephony/calls/${callData.id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: '1002', type: 'blind' })
    });
    const transferData = await resTransfer.json() as any;
    assert(resTransfer.status === 200, 'Endpoint POST /api/telephony/calls/:id/transfer responde com HTTP 200');
    assert(transferData.success === true, 'Chamada transferida para o ramal 1002 com sucesso');

    // 4. Test Call Outcome Registration (Tabulação Rápida)
    console.log('\n📌 TAREFA 4: Tabulação Rápida (Pós-Chamada) e Atualização de Histórico');
    const outcomeNotes = 'Lead demonstrou forte interesse no plano Enterprise. Reunião agendada para amanhã.';
    const resOutcome = await fetch(`${API_BASE}/api/telephony/calls/${callData.id}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'reuniao_agendada',
        duration: 145,
        notes: outcomeNotes,
        recordingUrl: 'https://storage.crdisk.com.br/recordings/test-call.mp3'
      })
    });
    const outcomeData = await resOutcome.json() as any;
    assert(resOutcome.status === 200, 'Endpoint POST /api/telephony/calls/:id/outcome responde com HTTP 200');
    assert(outcomeData.status === 'reuniao_agendada', 'Status do desfecho gravado como "reuniao_agendada"');
    assert(outcomeData.duration === 145, 'Duração da ligação gravada com exatidão (145s)');

    // 5. Verify Lead lastCallStatus & Timeline update
    console.log('\n📌 TAREFA 5: Validação da Linha do Tempo e lastCallStatus no CRM');
    const resTimeline = await fetch(`${API_BASE}/api/crm/leads/${testLead.id}/timeline`);
    const timelineData = await resTimeline.json() as any;
    const callInTimeline = timelineData.timeline.find((t: any) => t.type === 'call' && t.id === callData.id);
    assert(!!callInTimeline, 'Chamada registrada é injetada automaticamente na Timeline do Lead');
    assert(callInTimeline?.notes === outcomeNotes, 'Notas do operador visíveis no histórico da chamada na Timeline');

    const resUpdatedLead = await fetch(`${API_BASE}/api/crm/leads/${testLead.id}`);
    const updatedLeadData = await resUpdatedLead.json() as any;
    assert(updatedLeadData.lastCallStatus === 'reuniao_agendada', 'Campo lastCallStatus do Lead atualizado para "reuniao_agendada"');

    // 6. Test Power Dialer Session (Fila Automática de Discagem)
    console.log('\n📌 TAREFA 6: Motor de Discagem Automática (Power Dialer 2.0)');
    const selectedLeadsForQueue = leadsData.data.slice(0, 3).map((l: any) => l.id);
    const resStartPower = await fetch(`${API_BASE}/api/telephony/power-dialer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: selectedLeadsForQueue })
    });
    const powerSession = await resStartPower.json() as any;
    assert(resStartPower.status === 200, 'POST /api/telephony/power-dialer/start inicializa sessão');
    assert(powerSession.status === 'RUNNING', 'Sessão de discagem iniciada no estado RUNNING');
    assert(powerSession.queue.length === 3, 'Fila de discagem montada com os 3 leads selecionados');
    assert(powerSession.queue[0].status === 'IN_CALL', 'Primeiro lead da fila disparado automaticamente');

    // 7. Test Power Dialer Next Lead
    const resNext = await fetch(`${API_BASE}/api/telephony/power-dialer/next`, {
      method: 'POST'
    });
    const nextData = await resNext.json() as any;
    assert(resNext.status === 200, 'POST /api/telephony/power-dialer/next avança a fila');
    assert(nextData.session.currentIndex === 1, 'Ponteiro da fila avançado para o 2º lead');

    // 8. Test Power Dialer Pause & Stop
    const resPause = await fetch(`${API_BASE}/api/telephony/power-dialer/pause`, { method: 'POST' });
    const pauseData = await resPause.json() as any;
    assert(pauseData.status === 'PAUSED', 'Sessão do Power Dialer pausada com sucesso');

    const resStop = await fetch(`${API_BASE}/api/telephony/power-dialer/stop`, { method: 'POST' });
    const stopData = await resStop.json() as any;
    assert(stopData.success === true, 'Sessão do Power Dialer encerrada com sucesso');

    console.log('\n========================================================');
    console.log(`🏁 RESULTADO: ${passed} PASSOU / ${failed} FALHOU (Total: ${passed + failed})`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro na execução dos testes do Discador:', err);
    process.exit(1);
  }
}

runDialerTests();
