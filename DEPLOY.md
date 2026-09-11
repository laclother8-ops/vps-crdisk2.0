# 🚀 Guia Oficial de Deploy em Produção — CRDISK 2.0

Este guia contém as instruções passo a passo para hospedar e executar a plataforma **CRDISK** em qualquer Servidor VPS Cloud (**Hostinger VPS, DigitalOcean, AWS EC2, Hetzner, Linode ou Oracle Cloud**) com **Docker**, **Nginx Reverse Proxy**, **WebSockets permanentes**, **PostgreSQL 16 com pgvector** e **Certificados SSL automáticos via Let's Encrypt (Certbot)**.

---

## 📋 1. Requisitos Mínimos Recomendados da VPS

- **Sistema Operacional:** Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS (x86_64)
- **Processador:** 2 vCPUs
- **Memória RAM:** 4 GB (mínimo recomendado para Next.js 14 Standalone + PostgreSQL pgvector + Redis)
- **Armazenamento:** 40 GB SSD / NVMe
- **Portas Abertas no Firewall (UFW / Security Group):**
  - `22/tcp` (SSH)
  - `80/tcp` (HTTP)
  - `443/tcp` (HTTPS)

---

## 🛠️ 2. Preparação Inicial do Servidor (Ubuntu)

Conecte-se à sua VPS via SSH:
```bash
ssh root@SEU_IP_DO_SERVIDOR
```

Atualize os pacotes do sistema e instale os utilitários básicos:
```bash
apt update && apt upgrade -y
apt install -y git curl ufw apt-transport-https ca-certificates gnupg lsb-release
```

### Configurar Firewall Básico:
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🐳 3. Instalação do Docker e Docker Compose (V2)

Instale a versão oficial do Docker Engine:
```bash
# Adicionar chave GPG oficial do Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositório oficial
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine & Docker Compose Plugin
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

---

## 📦 4. Clonar o Repositório e Configurar Variáveis de Ambiente

```bash
# Clonar o repositório na pasta /opt/crdisk
git clone https://github.com/SEU_USUARIO/crdisk.git /opt/crdisk
cd /opt/crdisk

# Criar o arquivo de variáveis de produção
cp .env.production.example .env.production
nano .env.production
```

> [!IMPORTANT]
> Certifique-se de preencher as variáveis sensíveis no `.env.production`:
> - `DATABASE_URL` e senhas do Postgres/Redis.
> - `JWT_SECRET` e `SESSION_SECRET`.
> - `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_VERIFY_TOKEN`.
> - `OPENAI_API_KEY` para o motor de busca vetorial RAG da Sofia.
> - `APP_URL=https://app.crdisk.com.br` e `NEXT_PUBLIC_APP_URL`.

---

## 🔒 5. Emissão Inicial do Certificado SSL (Let's Encrypt / Certbot)

Antes de iniciar o Nginx com SSL, gere o primeiro certificado para o seu domínio (ex: `app.crdisk.com.br`):

```bash
# 1. Crie as pastas de certificados e webroot
mkdir -p certbot/conf certbot/www

# 2. Gere o certificado via Certbot Standalone
docker run -it --rm -p 80:80 \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --standalone \
  -d app.crdisk.com.br \
  --email seu-email@crdisk.com.br --agree-tos --no-eff-email
```

> [!TIP]
> Caso utilize outro domínio, ajuste a linha `ssl_certificate` no arquivo [`nginx/default.conf`](file:///c:/Users/Neo%20Loc/Downloads/crdisk/nginx/default.conf) para refletir a pasta gerada em `/etc/letsencrypt/live/SEU_DOMINIO/`.

---

## 🚀 6. Execução do Pré-Flight Check & Subida dos Containers

Antes de subir a aplicação, execute o script de verificação de prontidão:

```bash
# Instalar pnpm caso vá rodar o script fora do container
npm install -g tsx prisma @prisma/client
npx tsx scripts/pre-flight-check.ts
```

Suba toda a stack em background com Docker Compose:
```bash
# Build e inicialização de todos os serviços (App, Postgres pgvector, Redis, Nginx, Certbot)
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📊 7. Verificação de Saúde e Monitoramento

Verifique o status de execução de todos os containers:
```bash
docker compose -f docker-compose.prod.yml ps
```

Saída esperada:
```text
NAME                 IMAGE                     STATUS                    PORTS
crdisk-app-prod      crdisk-app                Up (healthy) (port 3000)
crdisk-postgres-prod pgvector/pgvector:pg16   Up (healthy) 5432/tcp
crdisk-redis-prod    redis:7-alpine            Up (healthy) 6379/tcp
crdisk-nginx-prod    nginx:alpine              Up 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
crdisk-certbot-prod  certbot/certbot           Up (renew loop ativo)
```

Acompanhe os logs em tempo real:
```bash
# Ver logs da aplicação Next.js
docker compose -f docker-compose.prod.yml logs -f app

# Ver logs do Nginx Reverse Proxy
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## 🔄 8. Atualização Contínua (Zero-Downtime Deploy)

Para atualizar a plataforma com novas versões do código sem perder dados:

```bash
cd /opt/crdisk
git pull origin main

# Executar migrations do banco de dados (se houver)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Reconstruir e reiniciar a imagem da aplicação
docker compose -f docker-compose.prod.yml up -d --build --no-deps app
```

---

## 🛡️ 9. Política de Backup do PostgreSQL com pgvector

Para criar um backup pontual do banco com vetores e dados:
```bash
# Backup para arquivo compactado
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres -d crdisk_prod_db | gzip > /opt/backups/crdisk_$(date +%Y%m%d_%H%M%S).sql.gz
```

Para automatizar backups diários via Cron (`crontab -e`):
```cron
0 3 * * * docker compose -f /opt/crdisk/docker-compose.prod.yml exec -T postgres pg_dump -U postgres -d crdisk_prod_db | gzip > /opt/backups/crdisk_$(date +\%Y\%m\%d).sql.gz
```

---

## 🎯 Parabéns!
Sua plataforma **CRDISK 2.0** está operando em produção com:
- ✅ **SSL TLSv1.3 & HSTS** ativo via Nginx.
- ✅ **WebSockets permanentes** para Discador e Chat ao vivo.
- ✅ **Persistência total de dados e vetores de IA** via `pgvector`.
- ✅ **Cache LRU ultra-rápido** via Redis.
- ✅ **Landing Page Comercial e Console de Homologação** prontos para escala.
