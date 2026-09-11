import { PrismaClient, prisma } from '../packages/database/src/index.js';
import * as crypto from 'crypto';

// Função utilitária para hash seguro de senha
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + ':crdisk_salt_2026').digest('hex');
}

export const initialSeedData = {
  workspaces: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'CRDISK Matriz',
      slug: 'crdisk-matriz',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '11111111-2222-2222-2222-222222222222',
      name: 'Cliente Alpha',
      slug: 'cliente-alpha',
      plan: 'pro',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  users: [
    {
      id: 'usr-superadmin-01',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Master Admin (CRDISK)',
      email: 'adm',
      passwordHash: hashPassword('052115wW@'),
      role: 'superadmin',
      sipExtension: '1000',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'usr-superadmin-02',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Master Admin (Email)',
      email: 'adm@crdisk.com.br',
      passwordHash: hashPassword('052115wW@'),
      role: 'superadmin',
      sipExtension: '1001',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'usr-alpha-admin-01',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Carlos Gestor',
      email: 'carlos@alpha.com',
      passwordHash: hashPassword('052115wW@'),
      role: 'workspace_admin',
      sipExtension: '2001',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'usr-alpha-operator-01',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Amanda Atendente',
      email: 'amanda@alpha.com',
      passwordHash: hashPassword('052115wW@'),
      role: 'operator',
      sipExtension: '2002',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  leads: [
    {
      id: 'lead-alpha-001',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Mariana Silva',
      phone: '+5511988887777',
      email: 'mariana@techsolucoes.com.br',
      company: 'Tech Soluções SP',
      status: 'contatado',
      funnelStage: 'qualificacao',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Inbound', 'WhatsApp', 'Tech'],
      score: 85,
      dealValue: 12500.0,
      assignedToId: 'usr-alpha-operator-01',
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date()
    },
    {
      id: 'lead-alpha-002',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Roberto Almeida',
      phone: '+5511977776666',
      email: 'roberto@distribuidorasp.com.br',
      company: 'Distribuidora São Paulo',
      status: 'em_atendimento_humano',
      funnelStage: 'apresentacao',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Prioridade Alta', 'Varejo'],
      score: 92,
      dealValue: 45000.0,
      assignedToId: 'usr-alpha-admin-01',
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date()
    },
    {
      id: 'lead-alpha-003',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Fernanda Costa',
      phone: '+5521966665555',
      email: 'fernanda@consultoriabio.com.br',
      company: 'Consultoria Bio Rio',
      status: 'interessado',
      funnelStage: 'proposta',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Proposta Enviada', 'Saúde'],
      score: 98,
      dealValue: 78000.0,
      assignedToId: 'usr-alpha-admin-01',
      createdAt: new Date(Date.now() - 3600000 * 4),
      updatedAt: new Date()
    }
  ],
  calls: [
    {
      id: 'call-alpha-001',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      leadId: 'lead-alpha-001',
      agentId: 'usr-alpha-operator-01',
      duration: 142,
      status: 'answered',
      recordingUrl: 'https://storage.crdisk.com.br/recordings/call-alpha-001.mp3',
      notes: 'Cliente interessado na integração WhatsApp + Discador. Demonstração agendada.',
      createdAt: new Date(Date.now() - 3600000 * 2)
    }
  ],
  messages: [
    {
      id: 'msg-alpha-001',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      leadId: 'lead-alpha-001',
      sender: 'lead',
      channel: 'whatsapp',
      content: 'Olá! Gostaria de mais informações sobre os planos da plataforma.',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000 * 3)
    },
    {
      id: 'msg-alpha-002',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      leadId: 'lead-alpha-001',
      sender: 'ai',
      channel: 'whatsapp',
      content: 'Olá Mariana! Seja bem-vinda ao atendimento CRDISK. Temos soluções completas de CRM e Discador.',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000 * 3 + 2000)
    }
  ],
  followUpJobs: [
    {
      id: 'job-alpha-001',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      leadId: 'lead-alpha-003',
      triggerType: 'STAGE_PROPOSTA',
      scheduledFor: new Date(Date.now() + 3600000 * 24),
      status: 'pending',
      step: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  knowledgeBase: [
    {
      id: 'kb-alpha-001',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      title: 'Tabela de Planos e Preços CRDISK 2026',
      category: 'comercial',
      content: 'Plano Starter: R$ 490/mês para até 3 operadores. Plano Enterprise: R$ 990/mês com operadores ilimitados, discador inteligente e IA receptiva.',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

export async function main() {
  console.log('🌱 Executando Seed Multi-tenant para CRDISK...');

  // 1. Limpeza de dados antigos (em ordem reversa para respeitar FKs)
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`).catch(() => {});
  } catch (e) {
    // pgvector extension creation optional if already active
  }

  // 2. Criar Workspaces
  console.log('🏢 Semeando Workspaces...');
  for (const ws of initialSeedData.workspaces) {
    await prisma.workspace.upsert({
      where: { id: ws.id },
      update: {
        name: ws.name,
        slug: ws.slug,
        plan: ws.plan,
        status: ws.status
      },
      create: ws
    });
  }

  // 3. Criar Usuários (Superadmin e Usuários de Tenant)
  console.log('👤 Semeando Usuários com RBAC...');
  for (const user of initialSeedData.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId,
        passwordHash: user.passwordHash,
        status: user.status
      },
      create: user
    });
  }

  // 4. Criar Leads para validação de isolamento de tenants
  console.log('🎯 Semeando Leads do CRM...');
  for (const lead of initialSeedData.leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: {
        name: lead.name,
        phone: lead.phone,
        status: lead.status,
        funnelStage: lead.funnelStage,
        score: lead.score,
        dealValue: lead.dealValue,
        tags: lead.tags
      },
      create: lead
    });
  }

  // 5. Criar Chamadas
  console.log('📞 Semeando Histórico de Chamadas...');
  for (const call of initialSeedData.calls) {
    await prisma.call.upsert({
      where: { id: call.id },
      update: {
        status: call.status,
        duration: call.duration,
        notes: call.notes
      },
      create: call
    });
  }

  // 6. Criar Mensagens
  console.log('💬 Semeando Mensagens de Chat...');
  for (const msg of initialSeedData.messages) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: {
        content: msg.content,
        type: msg.type
      },
      create: msg
    });
  }

  // 7. Criar Jobs de Follow-up
  console.log('⚡ Semeando Fila de Follow-up...');
  for (const job of initialSeedData.followUpJobs) {
    await prisma.followUpJob.upsert({
      where: { id: job.id },
      update: {
        status: job.status,
        scheduledFor: job.scheduledFor
      },
      create: job
    });
  }

  // 8. Criar Itens da Base de Conhecimento RAG
  console.log('🧠 Semeando Base de Conhecimento RAG...');
  for (const kb of initialSeedData.knowledgeBase) {
    await prisma.knowledgeBase.upsert({
      where: { id: kb.id },
      update: {
        title: kb.title,
        content: kb.content,
        category: kb.category
      },
      create: kb
    });
  }

  console.log('✅ Seed finalizado com sucesso!');
  console.log(`
  📋 Credenciais Padrão Criadas:
  - Super Admin:
    * Usuário/Email: adm (ou adm@crdisk.com.br)
    * Senha: 052115wW@
    * Workspace: CRDISK Matriz (${initialSeedData.workspaces[0].id})
  - Admin Tenant Alpha:
    * Email: carlos@alpha.com
    * Senha: 052115wW@
    * Workspace: Cliente Alpha (${initialSeedData.workspaces[1].id})
  - Operador Tenant Alpha:
    * Email: amanda@alpha.com
    * Senha: 052115wW@
    * Workspace: Cliente Alpha (${initialSeedData.workspaces[1].id})
  `);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Erro durante a execução do seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
