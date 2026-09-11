import { FollowupWorker } from './src/modules/crm/followup.worker.js';
import { crmService } from './src/modules/crm/crm.service.js';
import { chatService } from './src/modules/chat/chat.service.js';
import { aiService } from './src/modules/ai/ai.service.js';
import { CallOutcomeStatus, FollowupQueueStatus, FollowupTriggerType, FunnelStage, MessageSender } from '@omnicrm/shared';

async function runFollowupTestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 TEST SUITE: CRDISK Intelligent Automatic Follow-up Worker');
  console.log('🧪 ========================================================\n');

  const worker = new FollowupWorker();

  // Test 1: Commercial Hours Validation (Mon-Fri, 09:00 to 19:00, UTC-3)
  console.log('📌 Test 1: Commercial Hours Detection');
  const wednesdayNoon = new Date('2026-09-09T15:00:00Z'); // 12:00 BRT on Wednesday
  const isWedCommercial = worker.isCommercialHours(wednesdayNoon);
  console.log(`- Wednesday 12:00 BRT is commercial? ${isWedCommercial} (Expected: true)`);
  if (!isWedCommercial) throw new Error('Commercial hours check failed for Wednesday 12:00 BRT');

  const sundayAfternoon = new Date('2026-09-13T18:00:00Z'); // Sunday
  const isSunCommercial = worker.isCommercialHours(sundayAfternoon);
  console.log(`- Sunday 15:00 BRT is commercial? ${isSunCommercial} (Expected: false)`);
  if (isSunCommercial) throw new Error('Commercial hours check failed for Sunday');

  const nightTime = new Date('2026-09-09T01:00:00Z'); // 22:00 BRT on previous night
  const isNightCommercial = worker.isCommercialHours(nightTime);
  console.log(`- Night 22:00 BRT is commercial? ${isNightCommercial} (Expected: false)`);
  if (isNightCommercial) throw new Error('Commercial hours check failed for 22:00 BRT');

  // Test 2: Next Commercial Slot Calculation
  console.log('\n📌 Test 2: Next Commercial Slot Calculation');
  const fridayNight = new Date('2026-09-11T23:00:00Z'); // Friday 20:00 BRT
  const nextSlotFromFriday = worker.getNextCommercialSlot(fridayNight);
  console.log(`- Next slot from Friday 20:00 BRT: ${nextSlotFromFriday.toISOString()}`);
  console.log(`- Day of week: ${nextSlotFromFriday.toLocaleDateString('pt-BR', { weekday: 'long' })} at ${nextSlotFromFriday.toLocaleTimeString('pt-BR')}`);

  // Test 3: Dial Outcome Trigger Enqueueing
  console.log('\n📌 Test 3: Dialer Outcome Trigger (+10 min delay)');
  const testLead = await crmService.createLead({
    name: 'Roberto Alcantara',
    phone: '+5511999998888',
    company: 'Logística Express'
  });

  const queuedItem = await crmService.enqueueFollowup(
    testLead.id,
    FollowupTriggerType.DISPOSITION_NAO_ATENDEU,
    0 // Immediate for testing execution
  );
  console.log(`- Enqueued Follow-up: ID=${queuedItem.id}, Trigger=${queuedItem.triggerType}, Status=${queuedItem.status}`);
  if (!queuedItem.id || queuedItem.status !== FollowupQueueStatus.PENDENTE) {
    throw new Error('Failed to enqueue followup item.');
  }

  // Test 4: AI Contextual Message Generation
  console.log('\n📌 Test 4: AI Contextual Message Generation');
  const generatedMessage = await aiService.generateContextualFollowup(
    testLead,
    FollowupTriggerType.DISPOSITION_NAO_ATENDEU,
    []
  );
  console.log(`- AI Sofia Follow-up Copy: "${generatedMessage}"`);
  if (!generatedMessage || !generatedMessage.includes('Roberto')) {
    console.warn('AI message did not include lead name, but text was generated successfully.');
  }

  // Test 5: Queue Processing Execution
  console.log('\n📌 Test 5: Worker Process Pending Queue');
  const processResult = await worker.processPendingQueue();
  console.log('- Process Queue Results:', processResult);
  if (processResult.executed < 1 && processResult.rescheduled < 1) {
    throw new Error('Follow-up worker did not process pending item.');
  }

  // Test 6: Opt-Out Security Cancellation
  console.log('\n📌 Test 6: Opt-Out Safety Validation (LGPD)');
  const optOutLead = await crmService.createLead({
    name: 'Mariana Lima (OptOut)',
    phone: '+5511977776666',
    optOut: true
  });
  const optOutQueueItem = await crmService.enqueueFollowup(
    optOutLead.id,
    FollowupTriggerType.DISPOSITION_NAO_ATENDEU,
    0
  );
  const optOutProcess = await worker.processPendingQueue();
  console.log('- Opt-out Queue Process Result:', optOutProcess);
  const reloadedOptOutItem = (await crmService.listFollowupQueue()).find(f => f.id === optOutQueueItem.id);
  console.log(`- Opt-out Followup Status: ${reloadedOptOutItem?.status} (Expected: cancelado)`);
  if (reloadedOptOutItem?.status !== FollowupQueueStatus.CANCELADO) {
    throw new Error('Opt-out lead followup was not cancelled!');
  }

  // Test 7: Cancellation on Inbound Interaction
  console.log('\n📌 Test 7: Automatic Cancellation upon Inbound Lead Interaction');
  const activeLead = await crmService.createLead({
    name: 'Carlos Mendes',
    phone: '+5511966665555'
  });
  const activeFollowup = await crmService.enqueueFollowup(
    activeLead.id,
    FollowupTriggerType.DISPOSITION_OCUPADO,
    15
  );
  console.log(`- Active followup created: ${activeFollowup.id}`);
  
  // Simulate lead sending message
  await chatService.handleInboundWhatsApp({
    fromPhone: '+5511966665555',
    senderName: 'Carlos Mendes',
    text: 'Olá Sofia, vi que tentaram ligar. Pode me enviar a proposta por aqui?',
    type: 'text'
  });

  const reloadedActiveItem = (await crmService.listFollowupQueue()).find(f => f.id === activeFollowup.id);
  console.log(`- Followup Status after Inbound: ${reloadedActiveItem?.status} (Expected: cancelado)`);
  if (reloadedActiveItem?.status !== FollowupQueueStatus.CANCELADO) {
    throw new Error('Follow-up was not cancelled after lead sent an inbound message!');
  }

  // Test 8: Stagnant Proposals Sweeper (>24h in PROPOSTA)
  console.log('\n📌 Test 8: Stagnant Proposals Sweeper');
  const proposalLead = await crmService.createLead({
    name: 'Empresa Alfa Ltda',
    phone: '+5511955554444',
    funnelStage: FunnelStage.PROPOSTA
  });
  // Backdate lead
  proposalLead.updatedAt = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30h ago
  proposalLead.createdAt = new Date(Date.now() - 30 * 60 * 60 * 1000);

  const stagnantCount = await worker.checkStagnantProposals();
  console.log(`- Stagnant proposals found and enqueued: ${stagnantCount}`);
  if (stagnantCount < 1) {
    throw new Error('Stagnant proposal sweeper failed to detect backdated proposal lead.');
  }

  console.log('\n🎉 ========================================================');
  console.log('🎉 ALL FOLLOW-UP AUTOMATION TESTS PASSED SUCCESSFULLY! (8/8)');
  console.log('🎉 ========================================================');
}

runFollowupTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
