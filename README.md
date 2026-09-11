# 🚀 CRDISK — CRM, Chat Live, Smart Dialer & Autonomous AI Platform

Plataforma SaaS completa e integrada para gestão comercial de alta performance combinando:
1. **CRM com Pipeline Visual (Kanban)** e gestão de leads com enriquecimento contínuo.
2. **Chat Live Multicanal em Tempo Real** (foco oficial em WhatsApp Cloud API via WebSockets).
3. **Discador Telefônico Inteligente (WebRTC/VoIP)** com Power Dialer automático e tabulação de chamadas.
4. **Agentes Autônomos de IA (Sofia)** com RAG vetorial (`pgvector`), transcrição de áudio com OpenAI Whisper e Function Calling nativo.
5. **Motor de Follow-up Automático Orientado a Eventos** com validação de horário comercial brasileiro (Seg–Sex 09:00–19:00), proteção LGPD/Opt-out e cancelamento por interação recente.

---

## 🏗️ Arquitetura do Monorepo

```
crdisk/
├── apps/
│   ├── api/                     # Backend Fastify + WebSockets + Workers
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── ai/          # RAG, Whisper & Function Calling
│   │       │   ├── auth/        # Gestão de usuários e permissões
│   │       │   ├── chat/        # WhatsApp Cloud API & Chat Live
│   │       │   ├── crm/         # Leads, Pipeline & Follow-up Worker
│   │       │   ├── settings/    # Configurações & Testes de Integração
│   │       │   └── telephony/   # WebRTC Token, Chamadas & Power Dialer
│   │       └── websocket/       # Gateway de eventos em tempo real
│   └── web/                     # Frontend Next.js 14 (App Router) + Tailwind + Shadcn UI
│       ├── app/
│       │   ├── ai-agents/       # Estúdio de IA, RAG & Fila de Follow-up
│       │   ├── chat/            # Chat Multicanal (3 Colunas + Áudio Player)
│       │   ├── crm/             # Pipeline Kanban Drag-and-Drop
│       │   ├── dialer/          # Power Dialer Studio & Discador Flutuante
│       │   └── settings/        # Central de Configurações & Integrações
│       └── components/          # Design System Cyberpunk / Dark Glow
├── packages/
│   ├── ai-engine/               # Vector Store, Embeddings, Whisper & Prompts
│   ├── database/                # Schema Prisma com extensão vector(1536) & Seeds
│   ├── shared/                  # Tipos TypeScript compartilhados e Enums Zod
│   └── telephony/               # Adaptadores Twilio Voice SDK & SIP.js
├── docker-compose.yml           # PostgreSQL 16 (pgvector) + Redis
└── package.json                 # TurboRepo Monorepo Workspace
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Frontend** | Next.js 14+ (App Router), React 18, Tailwind CSS, Lucide Icons, WebSockets |
| **Backend** | Node.js, Fastify, TypeScript, Socket.io / Fastify WebSocket |
| **Banco de Dados** | PostgreSQL 16 com extensão `pgvector` (vetores de 1536 dimensões), Prisma ORM |
| **Mensageria & Filas** | Redis 7, Cron Jobs nativos e BullMQ |
| **Telefonia** | Twilio Voice WebRTC SDK & SIP.js para softphone no navegador |
| **Inteligência Artificial** | OpenAI (`gpt-4o-mini`, `gpt-4o`, `text-embedding-3-small`, `whisper-1`) e Anthropic Claude |

---

## ⚡ Como Rodar o Projeto Localmente

### 1. Pré-requisitos
- **Node.js**: Versão 20.x ou superior.
- **pnpm**: Gerenciador de pacotes (`npm install -g pnpm`).
- **Docker & Docker Compose**: Para subir o PostgreSQL com pgvector e Redis.

---

### 2. Passo a Passo de Instalação

#### 2.1 Clone o repositório e instale as dependências
```bash
git clone https://github.com/your-org/crdisk.git
cd crdisk
pnpm install
```

#### 2.2 Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

#### 2.3 Suba o Banco de Dados com Docker
Inicie os containers do **PostgreSQL 16 com pgvector** e **Redis**:
```bash
docker-compose up -d
```
> O PostgreSQL iniciará na porta `5432` com a extensão `pgvector` habilitada automaticamente.

#### 2.4 Execute as Migrations e o Seed Inicial
Gere o cliente do Prisma e popule a base de dados com leads, histórico de mensagens e base de conhecimento:
```bash
# Gerar Prisma Client
pnpm --filter @omnicrm/database build

# Criar tabelas no Postgres
pnpm --filter @omnicrm/database prisma db push

# Executar Seed
pnpm --filter @omnicrm/database prisma db seed
```

---

### 3. Executando em Modo de Desenvolvimento

Inicie o Backend Fastify (Porta **4000**) e o Frontend Next.js (Porta **3000**) simultaneamente:
```bash
pnpm dev
```

Abra seu navegador em:
- 🌐 **Frontend**: [http://localhost:3000](http://localhost:3000)
- 🔌 **API REST**: [http://localhost:4000](http://localhost:4000)
- 📡 **WebSocket Gateway**: `ws://localhost:4000/ws`

---

## 📱 Módulos e Rotas da Aplicação

| Rota | Descrição |
|---|---|
| **`/crm`** | Pipeline Kanban visual interativo com drag-and-drop, filtros de lead e atalhos rápidos de chamada e chat. |
| **`/chat`** | Central de conversas multicanal em 3 colunas (WhatsApp / Chat Live), player de áudio waveform, gravador de voz e botão de Assunção Humana. |
| **`/dialer`** | Power Dialer Studio com fila de discagem automática, countdown de 3 segundos e Softphone flutuante WebRTC com tabulação rápida de desfecho. |
| **`/ai-agents`** | Estúdio de IA Sofia com teste de busca semântica RAG, simulador de WhatsApp, transcrição Whisper e fila em tempo real de Follow-ups. |
| **`/settings`** | Painel de controle para credenciais Meta WhatsApp Cloud API, chaves de IA (OpenAI/Claude), upload de documentos PDF/TXT e telefonia Twilio/SIP. |

---

## 🔒 Segurança, Validações & Resiliência

1. **Horário Comercial Brasileiro**: O worker valida dias úteis (Segunda a Sexta, 09:00 às 19:00). Follow-ups expirados fora da janela são reagendados para o próximo dia útil às **09:15**.
2. **Opt-Out (LGPD)**: Leads com `opt_out = true` têm follow-ups cancelados de forma irreversível com nota de auditoria.
3. **Meta Rate Limit Resilience**: Requisições para a WhatsApp Cloud API possuem tratamento para erro **HTTP 429** com exponential backoff e retries automáticos.
4. **Webhook Handshake**: Validação oficial via `hub.challenge` e `hub.verify_token` da Meta.
5. **Assunção Humana**: Se o lead estiver marcado em atendimento humano, as respostas da IA Sofia são suspensas de imediato para não interferir no operador.

---

## 🧪 Testes Automatizados

Para executar as suítes de testes automatizados do sistema:

```bash
# Teste da Fila de Follow-up Automático (8 cenários)
pnpm --filter @omnicrm/api exec tsx test_followup.ts

# Teste das Configurações e Diagnóstico de Integrações
pnpm --filter @omnicrm/api exec tsx test_settings.ts
```

---

## 📄 Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
