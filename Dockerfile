# =========================================================================
# 🐳 CRDISK SAAS - MULTI-STAGE PRODUCTION DOCKERFILE (NEXT.JS 14 STANDALONE)
# =========================================================================

# Stage 1: Base Alpine Image with Node.js & pnpm
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl curl
RUN npm install -g pnpm@9.15.4

# Stage 2: Dependencies Installation with Cached Layering
FROM base AS dependencies
WORKDIR /app

# Copy Monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/telephony/package.json ./packages/telephony/
COPY packages/ai-engine/package.json ./packages/ai-engine/
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Stage 3: Build & Bundle Standalone Application
FROM base AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/apps ./apps
COPY --from=dependencies /app/prisma ./prisma
COPY . .

# Generate Prisma Client with pgvector extension support
ENV DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/crdisk_db?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate --schema=./prisma/schema.prisma || true

# Build monorepo packages and Next.js standalone web application
RUN pnpm --filter @omnicrm/shared build || true
RUN pnpm --filter @omnicrm/web build

# Stage 4: Ultra-light Production Runtime Container
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install production dependencies for system checks & openssl
RUN apk add --no-cache openssl curl

# Create non-privileged system user for maximum container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static assets and standalone build output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma schema & migration files for container runtime initialization
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/admin/health/logs || exit 1

# Start Next.js Standalone Production Server
CMD ["node", "apps/web/server.js"]
