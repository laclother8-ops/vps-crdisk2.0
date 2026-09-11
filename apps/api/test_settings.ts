import { settingsService } from './src/modules/settings/settings.service.js';
import { aiService } from './src/modules/ai/ai.service.js';

async function runSettingsTestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 TEST SUITE: CRDISK Settings, Error Resilience & Diagnostics');
  console.log('🧪 ========================================================\n');

  // Test 1: Retrieve Initial Settings
  console.log('📌 Test 1: Fetch Current System Settings');
  const initialSettings = settingsService.getSettings();
  console.log('- WhatsApp Status:', initialSettings.whatsapp.status);
  console.log('- AI Default Model:', initialSettings.ai.defaultModel);
  console.log('- Telephony Provider:', initialSettings.telephony.provider);
  if (!initialSettings.whatsapp || !initialSettings.ai || !initialSettings.telephony) {
    throw new Error('Failed to retrieve initial system settings.');
  }

  // Test 2: Update System Settings
  console.log('\n📌 Test 2: Update System Settings');
  const updated = settingsService.updateSettings({
    ai: {
      defaultModel: 'gpt-4o',
      temperature: 0.8
    } as any,
    telephony: {
      provider: 'twilio',
      defaultCallerId: '+5511988887777'
    } as any
  });
  console.log(`- Updated Model: ${updated.ai.defaultModel} (Expected: gpt-4o)`);
  console.log(`- Updated Caller ID: ${updated.telephony.defaultCallerId} (Expected: +5511988887777)`);
  if (updated.ai.defaultModel !== 'gpt-4o' || updated.telephony.defaultCallerId !== '+5511988887777') {
    throw new Error('Settings update failed.');
  }

  // Test 3: WhatsApp Cloud API Connection Diagnostic
  console.log('\n📌 Test 3: WhatsApp Cloud API Connection Diagnostic');
  const waResult = await settingsService.testWhatsAppConnection('104829104812903', 'EAAG...');
  console.log('- WhatsApp Diagnostic Result:', waResult);
  if (!waResult.success) {
    throw new Error('WhatsApp diagnostic check failed.');
  }

  // Test 4: AI Engine Connection Diagnostic
  console.log('\n📌 Test 4: AI Engine Diagnostic Test');
  const aiResult = await settingsService.testAIConnection('sk-proj-...', 'gpt-4o-mini');
  console.log('- AI Diagnostic Result:', aiResult);
  if (!aiResult.success) {
    throw new Error('AI diagnostic test failed.');
  }

  // Test 5: Telephony WebRTC Token Diagnostic
  console.log('\n📌 Test 5: Telephony WebRTC Token Diagnostic');
  const telResult = await settingsService.testTelephonyConnection('twilio');
  console.log('- Telephony Diagnostic Result:', telResult);
  if (!telResult.success || !telResult.tokenPreview) {
    throw new Error('Telephony diagnostic test failed.');
  }

  // Test 6: RAG Ingestion from Settings / Knowledge Base
  console.log('\n📌 Test 6: Knowledge Base Ingestion via Settings');
  const doc = await aiService.addKnowledgeBaseItem(
    'Manual de Políticas de Atendimento 2026',
    'Todos os clientes com planos Enterprise possuem atendimento prioritário 24/7 e SLA de 15 minutos.',
    'POLITICAS'
  );
  console.log(`- Ingested Doc ID: ${doc.id}, Title: "${doc.title}", Vector Dimensions: ${doc.embedding?.length}`);
  if (!doc.id || doc.embedding?.length !== 1536) {
    throw new Error('Knowledge Base RAG vectorization failed.');
  }

  console.log('\n🎉 ========================================================');
  console.log('🎉 ALL SETTINGS & RESILIENCE TESTS PASSED SUCCESSFULLY! (6/6)');
  console.log('🎉 ========================================================');
}

runSettingsTestSuite().catch(err => {
  console.error('❌ Settings test suite failed:', err);
  process.exit(1);
});
