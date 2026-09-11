import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

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
    // CRDISK Matriz (11111111-1111-1111-1111-111111111111)
    {
      id: 'lead-matriz-001',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Eduardo Silveira',
      phone: '+5511987654321',
      email: 'eduardo@fintechbrasil.com.br',
      company: 'Fintech Brasil Inovações',
      status: 'nao_contatado',
      funnelStage: 'novo_lead',
      lastCallStatus: null,
      optOut: false,
      tags: ['Inbound', 'WhatsApp', 'Alta Prioridade'],
      score: 78,
      dealValue: 28500.0,
      assignedToId: 'usr-superadmin-01',
      createdAt: new Date(Date.now() - 3600000 * 3),
      updatedAt: new Date()
    },
    {
      id: 'lead-matriz-002',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Mariana Silva',
      phone: '+5511988887777',
      email: 'mariana@techsolucoes.com.br',
      company: 'Tech Soluções SP',
      status: 'contatado',
      funnelStage: 'qualificacao',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Inbound', 'Tech', 'Enterprise'],
      score: 88,
      dealValue: 42000.0,
      assignedToId: 'usr-superadmin-01',
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date()
    },
    {
      id: 'lead-matriz-003',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Dr. Paulo Guimarães',
      phone: '+5511999998888',
      email: 'paulo@hospitalmedcenter.com.br',
      company: 'Hospital MedCenter',
      status: 'interessado',
      funnelStage: 'proposta',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Proposta Enviada', 'Saúde', 'VIP'],
      score: 96,
      dealValue: 95000.0,
      assignedToId: 'usr-superadmin-02',
      createdAt: new Date(Date.now() - 3600000 * 48),
      updatedAt: new Date()
    },
    {
      id: 'lead-matriz-004',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Roberto Almeida',
      phone: '+5511977776666',
      email: 'roberto@distribuidorasp.com.br',
      company: 'Distribuidora São Paulo',
      status: 'em_atendimento_humano',
      funnelStage: 'followup_ativo',
      lastCallStatus: 'reuniao_agendada',
      optOut: false,
      tags: ['Follow-up Ativo', 'Varejo'],
      score: 84,
      dealValue: 36000.0,
      assignedToId: 'usr-superadmin-01',
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date()
    },
    {
      id: 'lead-matriz-005',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Lucas Mendonça',
      phone: '+5541988881111',
      email: 'lucas@agrotechsul.com.br',
      company: 'AgroTech Sul Logística',
      status: 'cliente',
      funnelStage: 'fechado_ganho',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Contrato Assinado', 'Agro', 'Enterprise'],
      score: 100,
      dealValue: 140000.0,
      assignedToId: 'usr-superadmin-01',
      createdAt: new Date(Date.now() - 3600000 * 120),
      updatedAt: new Date()
    },
    {
      id: 'lead-matriz-006',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      name: 'Beatriz Lima',
      phone: '+5531987773333',
      email: 'beatriz@studiodigital.com.br',
      company: 'Studio Digital MG',
      status: 'nao_interessado',
      funnelStage: 'perdido',
      lastCallStatus: 'sem_interesse',
      optOut: false,
      tags: ['Orçamento Limitado', 'Design'],
      score: 30,
      dealValue: 12000.0,
      assignedToId: 'usr-superadmin-02',
      createdAt: new Date(Date.now() - 3600000 * 72),
      updatedAt: new Date()
    },

    // Cliente Alpha (11111111-2222-2222-2222-222222222222)
    {
      id: 'lead-alpha-001',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Fernanda Costa',
      phone: '+5521966665555',
      email: 'fernanda@consultoriabio.com.br',
      company: 'Consultoria Bio Rio',
      status: 'contatado',
      funnelStage: 'qualificacao',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Inbound', 'WhatsApp', 'Tech'],
      score: 85,
      dealValue: 24500.0,
      assignedToId: 'usr-alpha-operator-01',
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date()
    },
    {
      id: 'lead-alpha-002',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Gustavo Pinheiro',
      phone: '+5521988884444',
      email: 'gustavo@logrio.com.br',
      company: 'LogRio Transportes',
      status: 'em_atendimento_humano',
      funnelStage: 'apresentacao',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Prioridade Alta', 'Logística'],
      score: 92,
      dealValue: 55000.0,
      assignedToId: 'usr-alpha-admin-01',
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date()
    },
    {
      id: 'lead-alpha-003',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Camila Vasconcelos',
      phone: '+5521977773333',
      email: 'camila@clinicaestetica.com.br',
      company: 'Clínica Estética Prime',
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
    },
    {
      id: 'lead-alpha-004',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Rodrigo Brandão',
      phone: '+5521999992222',
      email: 'rodrigo@solucoesnet.com.br',
      company: 'Soluções Net Telecom',
      status: 'contatado',
      funnelStage: 'followup_ativo',
      lastCallStatus: 'reuniao_agendada',
      optOut: false,
      tags: ['Follow-up Ativo', 'Telecom'],
      score: 80,
      dealValue: 48000.0,
      assignedToId: 'usr-alpha-operator-01',
      createdAt: new Date(Date.now() - 3600000 * 18),
      updatedAt: new Date()
    },
    {
      id: 'lead-alpha-005',
      workspaceId: '11111111-2222-2222-2222-222222222222',
      name: 'Juliana Barbosa',
      phone: '+5521966661111',
      email: 'juliana@modasrio.com.br',
      company: 'Modas Rio E-commerce',
      status: 'cliente',
      funnelStage: 'fechado_ganho',
      lastCallStatus: 'atendida',
      optOut: false,
      tags: ['Fechado', 'E-commerce'],
      score: 100,
      dealValue: 65000.0,
      assignedToId: 'usr-alpha-admin-01',
      createdAt: new Date(Date.now() - 3600000 * 96),
      updatedAt: new Date()
    }
  ],
  calls: [
    {
      id: 'call-matriz-001',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      leadId: 'lead-matriz-002',
      agentId: 'usr-superadmin-01',
      duration: 185,
      status: 'answered',
      recordingUrl: 'https://storage.crdisk.com.br/recordings/call-matriz-001.mp3',
      notes: 'Cliente demonstrou alto interesse no plano Enterprise com 10 ramais WebRTC. Demonstração agendada.',
      createdAt: new Date(Date.now() - 3600000 * 4)
    },
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
      id: 'msg-matriz-001',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      leadId: 'lead-matriz-001',
      sender: 'lead',
      channel: 'whatsapp',
      content: 'Olá, vi o anúncio do CRDISK e gostaria de saber se vocês atendem operações com 20 atendentes.',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000 * 2)
    },
    {
      id: 'msg-matriz-002',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      leadId: 'lead-matriz-001',
      sender: 'ai',
      channel: 'whatsapp',
      content: 'Olá Eduardo! Perfeitamente. O CRDISK foi desenhado para operações de alta escala com discador inteligente e IA. Podemos agendar uma apresentação rápida?',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000 * 2 + 3000)
    },
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
      content: 'Olá Fernanda! Seja bem-vinda ao atendimento CRDISK. Temos soluções completas de CRM e Discador.',
      type: 'text',
      createdAt: new Date(Date.now() - 3600000 * 3 + 2000)
    }
  ],
  followUpJobs: [
    {
      id: 'job-matriz-001',
      workspaceId: '11111111-1111-1111-1111-111111111111',
      leadId: 'lead-matriz-003',
      triggerType: 'STAGE_PROPOSTA',
      scheduledFor: new Date(Date.now() + 3600000 * 24),
      status: 'pending',
      step: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
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

export async function seedDatabase() {
  console.log('🌱 Executando Seed Multi-tenant para CRDISK...');

  for (const ws of initialSeedData.workspaces) {
    await prisma.workspace.upsert({
      where: { id: ws.id },
      update: ws,
      create: ws
    });
  }

  for (const user of initialSeedData.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    });
  }

  for (const lead of initialSeedData.leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: lead,
      create: lead
    });
  }

  for (const call of initialSeedData.calls) {
    await prisma.call.upsert({
      where: { id: call.id },
      update: call,
      create: call
    });
  }

  for (const msg of initialSeedData.messages) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: msg,
      create: msg
    });
  }

  for (const job of initialSeedData.followUpJobs) {
    await prisma.followUpJob.upsert({
      where: { id: job.id },
      update: job,
      create: job
    });
  }

  for (const kb of initialSeedData.knowledgeBase) {
    await prisma.knowledgeBase.upsert({
      where: { id: kb.id },
      update: kb,
      create: kb
    });
  }

  console.log('✅ Seed finalizado com sucesso!');
}
