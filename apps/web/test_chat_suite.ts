/**
 * CRDISK - Suíte de Testes Automatizados de Chat Live, Meta WhatsApp Webhook & WebSockets
 * Valida:
 * 1. Meta WhatsApp Webhook Handshake (GET) com validação de token e challenge
 * 2. Meta WhatsApp Inbound Text Message (POST) e persistência no banco
 * 3. Meta WhatsApp Inbound Audio Message com transcrição Whisper
 * 4. Meta Delivery Status Updates (sent -> delivered -> read)
 * 5. Envio de mensagem pelo Atendente e emissão de eventos
 * 6. Human Handoff (Transbordo Humano) e Supressão de Respostas da IA Sofia
 * 7. Auto-Handoff ao digitar (Typing status)
 * 8. Filtragem de conversas em 4 abas (Minhas, Fila Geral, IA Sofia, Finalizadas)
 * 9. Templates de respostas pré-gravadas (Canned Responses)
 * 10. Transferência de atendimento entre operadores e departamentos
 */

const API_BASE = 'http://localhost:4000';

async function runTests() {
  console.log('💬 ========================================================');
  console.log('💬 CRDISK LIVE CHAT & WHATSAPP WEBHOOK VERIFICATION SUITE');
  console.log('💬 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------
    // 1. Meta WhatsApp Cloud API Webhook Handshake (GET)
    // ---------------------------------------------------------
    console.log('📌 CENÁRIO 1: Validação do Handshake Meta WhatsApp Cloud API (GET)');
    
    // 1.1 Token correto
    const validChallenge = 'CRDISK_CHALLENGE_TEST_' + Date.now();
    const handshakeRes = await fetch(
      `${API_BASE}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=omnicrm_webhook_secret_2026&hub.challenge=${validChallenge}`
    );
    const handshakeText = await handshakeRes.text();
    assert(handshakeRes.status === 200, 'Handshake com token válido retorna HTTP 200');
    assert(handshakeText === validChallenge, 'Handshake retorna exatamente o challenge da Meta', `Retornou: ${handshakeText}`);

    // 1.2 Token inválido
    const invalidRes = await fetch(
      `${API_BASE}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token_invalido_hacker&hub.challenge=12345`
    );
    assert(invalidRes.status === 403, 'Handshake com token inválido rejeita com HTTP 403 Forbidden');

    // ---------------------------------------------------------
    // 2. Meta WhatsApp Inbound Text Message (POST)
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 2: Recepção de Mensagem de Texto Inbound via Webhook (POST)');
    
    const testPhone = '5511999887766';
    const testMsgText = 'Olá equipe CRDISK, quero uma demonstração da plataforma para 20 operadores.';
    const metaPayloadText = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '5511999999999', phone_number_id: '123456789' },
                contacts: [{ profile: { name: 'Mariana Costa (Teste)' }, wa_id: testPhone }],
                messages: [
                  {
                    from: testPhone,
                    id: `wamid.HBgL${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: testMsgText },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    const inboundPostRes = await fetch(`${API_BASE}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayloadText)
    });
    const inboundPostData = await inboundPostRes.json();
    assert(inboundPostRes.status === 200, 'Webhook POST aceita payload da Meta com HTTP 200');
    assert(inboundPostData.status === 'EVENT_RECEIVED', 'Resposta confirma status EVENT_RECEIVED');
    assert(inboundPostData.processedMessages === 1, 'Webhook processou 1 mensagem de texto');

    // Verificar se lead foi localizado/criado e se a mensagem está no histórico
    const convsRes = await fetch(`${API_BASE}/api/chat/conversations`);
    const convs = await convsRes.json();
    const marianaConv = convs.find((c: any) => c.lead?.phone?.includes('999887766') || c.lead?.name?.includes('Mariana'));
    assert(!!marianaConv, 'Conversa do lead Mariana foi criada/localizada na listagem');
    
    const leadId = marianaConv.leadId;
    const msgsRes = await fetch(`${API_BASE}/api/chat/leads/${leadId}/messages`);
    const msgs = await msgsRes.json();
    const foundInbound = msgs.find((m: any) => m.content.includes('demonstração da plataforma'));
    assert(!!foundInbound, 'Mensagem de texto do WhatsApp foi persistida com sucesso no banco');

    // ---------------------------------------------------------
    // 3. Meta WhatsApp Inbound Audio Message com Whisper (POST)
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 3: Recepção de Áudio de Voz Inbound com Transcrição Whisper');
    
    const audioMsgId = `wamid.audio_${Date.now()}`;
    const metaPayloadAudio = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ profile: { name: 'Mariana Costa (Teste)' }, wa_id: testPhone }],
                messages: [
                  {
                    from: testPhone,
                    id: audioMsgId,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'audio',
                    audio: {
                      id: 'audio_meta_id_12345',
                      mime_type: 'audio/ogg; codecs=opus'
                    }
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    const inboundAudioRes = await fetch(`${API_BASE}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayloadAudio)
    });
    assert(inboundAudioRes.status === 200, 'Webhook processou mensagem de áudio com HTTP 200');

    // Verificar se mensagem de áudio foi gravada com tipo audio
    const msgsAfterAudioRes = await fetch(`${API_BASE}/api/chat/leads/${leadId}/messages`);
    const msgsAfterAudio = await msgsAfterAudioRes.json();
    const foundAudioMsg = msgsAfterAudio.find((m: any) => m.type === 'audio');
    assert(!!foundAudioMsg, 'Mensagem de áudio foi identificada e armazenada com type=audio');

    // ---------------------------------------------------------
    // 4. Meta Delivery Status Updates (sent -> delivered -> read)
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 4: Atualização de Status de Entrega da Meta (Status Callback)');
    
    const metaStatusPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                statuses: [
                  {
                    id: foundInbound?.id || 'msg-test-status',
                    recipient_id: testPhone,
                    status: 'read',
                    timestamp: Math.floor(Date.now() / 1000).toString()
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    const statusPostRes = await fetch(`${API_BASE}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaStatusPayload)
    });
    const statusPostData = await statusPostRes.json();
    assert(statusPostRes.status === 200, 'Webhook de status aceito com HTTP 200');
    assert(statusPostData.processedStatuses === 1, 'Processou 1 evento de status da Meta');

    // ---------------------------------------------------------
    // 5. Envio de Mensagem pelo Atendente Humano (POST /api/chat/messages)
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 5: Envio de Mensagem pelo Atendente e Validação de Schema');
    
    const operatorMsgRes = await fetch(`${API_BASE}/api/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        content: 'Olá Mariana! Prazer em falar com você. Segue nossa apresentação em anexo.',
        sender: 'human',
        channel: 'WHATSAPP',
        type: 'text'
      })
    });
    const operatorMsgData = await operatorMsgRes.json();
    assert(operatorMsgRes.status === 200, 'Mensagem do atendente enviada com sucesso');
    assert(operatorMsgData.sender === 'human', 'Sender registrado como human');
    assert(operatorMsgData.leadId === leadId, 'Vinculado ao leadId correto');

    // ---------------------------------------------------------
    // 6. Human Handoff (Transbordo Humano) e Supressão de IA
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 6: Transbordo Humano (Human Handoff) e Supressão da IA Sofia');
    
    // 6.1 Ativar modo humano
    const toggleHumanRes = await fetch(`${API_BASE}/api/chat/conversations/${leadId}/human-mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHuman: true })
    });
    const toggleHumanData = await toggleHumanRes.json();
    assert(toggleHumanRes.status === 200, 'Toggle de modo humano respondeu HTTP 200');
    assert(toggleHumanData.isHumanHandled === true, 'Modo humano ativo com sucesso (isHumanHandled=true)');

    // 6.2 Enviar mensagem inbound enquanto em modo humano -> IA NÃO deve responder
    const metaPayloadDuringHuman = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                contacts: [{ profile: { name: 'Mariana Costa' }, wa_id: testPhone }],
                messages: [
                  {
                    from: testPhone,
                    id: `wamid.human_${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Pode me enviar a proposta por aqui?' },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };
    await fetch(`${API_BASE}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayloadDuringHuman)
    });

    // Aguardar 1.5s e checar se IA permaneceu silenciada
    await new Promise(r => setTimeout(r, 1500));
    const msgsCheckRes = await fetch(`${API_BASE}/api/chat/leads/${leadId}/messages`);
    const msgsCheck = await msgsCheckRes.json();
    const lastMsg = msgsCheck[msgsCheck.length - 1];
    assert(lastMsg.sender !== 'ai', 'IA Sofia permaneceu silenciada durante Atendimento Humano Ativo');

    // ---------------------------------------------------------
    // 7. Auto-Handoff ao Digitar (Typing Status)
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 7: Auto-Handoff e Notificação de Digitação');
    
    const typingRes = await fetch(`${API_BASE}/api/chat/conversations/${leadId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'human' })
    });
    const typingData = await typingRes.json();
    assert(typingRes.status === 200, 'Notificação de digitação processada com sucesso');
    assert(typingData.isHumanHandled === true, 'Auto-handoff ativado ao detectar operador digitando');

    // ---------------------------------------------------------
    // 8. Filtragem de Conversas em 4 Abas
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 8: Filtros da Lista de Conversas (4 Abas do Painel)');
    
    // 8.1 Minhas conversas (em atendimento humano)
    const mineRes = await fetch(`${API_BASE}/api/chat/conversations?filter=mine`);
    const mineList = await mineRes.json();
    assert(Array.isArray(mineList) && mineList.some((c: any) => c.leadId === leadId), 'Aba "Minhas Conversas" inclui leads em atendimento humano');

    // 8.2 Em atendimento com IA
    const aiRes = await fetch(`${API_BASE}/api/chat/conversations?filter=ai`);
    const aiList = await aiRes.json();
    assert(Array.isArray(aiList), 'Aba "Em Atendimento com IA" lista conversas ativas da Sofia');

    // 8.3 Fila Geral
    const unassignedRes = await fetch(`${API_BASE}/api/chat/conversations?filter=unassigned`);
    const unassignedList = await unassignedRes.json();
    assert(Array.isArray(unassignedList), 'Aba "Fila Geral" responde corretamente');

    // 8.4 Finalizadas
    const closedRes = await fetch(`${API_BASE}/api/chat/conversations?filter=closed`);
    const closedList = await closedRes.json();
    assert(Array.isArray(closedList), 'Aba "Finalizadas" responde corretamente');

    // ---------------------------------------------------------
    // 9. Templates de Respostas Pré-Gravadas (Canned Responses)
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 9: Catálogo de Respostas Pré-gravadas / Templates');
    
    const templatesRes = await fetch(`${API_BASE}/api/chat/templates`);
    const templates = await templatesRes.json();
    assert(Array.isArray(templates) && templates.length >= 4, 'Templates pré-gravados disponíveis para o operador');
    const hasGreeting = templates.some((t: any) => t.shortcut === '#ola');
    const hasProposal = templates.some((t: any) => t.shortcut === '#proposta');
    assert(hasGreeting && hasProposal, 'Templates possuem atalhos (#ola, #proposta) mapeados');

    // ---------------------------------------------------------
    // 10. Transferência de Atendimento Entre Operadores e Departamentos
    // ---------------------------------------------------------
    console.log('\n📌 CENÁRIO 10: Transferência de Atendimento');
    
    const transferRes = await fetch(`${API_BASE}/api/chat/conversations/${leadId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: 'Lucas Santos',
        targetDepartment: 'Comercial / Vendas',
        notes: 'Cliente demonstrou interesse no plano Enterprise com 20 ramais.'
      })
    });
    const transferData = await transferRes.json();
    assert(transferRes.status === 200, 'Transferência de atendimento efetuada com sucesso');
    assert(transferData.assignedTo === 'Lucas Santos', 'Atribuído ao operador de destino correto');
    assert(transferData.assignedDepartment === 'Comercial / Vendas', 'Atribuído ao departamento de destino correto');

    // Verificar se nota de transferência foi inserida no chat
    const msgsAfterTransferRes = await fetch(`${API_BASE}/api/chat/leads/${leadId}/messages`);
    const msgsAfterTransfer = await msgsAfterTransferRes.json();
    const transferNoteMsg = msgsAfterTransfer.find((m: any) => m.content.includes('[Transferência de Atendimento]'));
    assert(!!transferNoteMsg, 'Mensagem interna de transferência registrada no histórico do chat');

    // ---------------------------------------------------------
    // RELATÓRIO FINAL
    // ---------------------------------------------------------
    console.log('\n========================================================');
    console.log(`📊 RESULTADO DA SUÍTE DE CHAT & WHATSAPP:`);
    console.log(`   ✅ Testes Aprovados: ${passed}`);
    console.log(`   ❌ Testes Falhos:    ${failed}`);
    console.log(`   📈 Taxa de Sucesso:  ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Erro fatal ao executar a suíte de testes de chat:', err);
    process.exit(1);
  }
}

runTests();
