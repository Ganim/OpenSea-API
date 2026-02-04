# ===============================================
# OpenSea-API Dockerfile
# Multi-stage build for optimized production image
# ===============================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala todas as dependências (incluindo dev)
RUN npm ci --ignore-scripts

# Copia código fonte
COPY . .

# Gera Prisma Client (URL dummy pois generate não precisa de conexão real)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build da aplicação
RUN npm run build

# Stage 3: Runner (produção)
FROM node:22-alpine AS runner
WORKDIR /app

# Configurações de ambiente
ENV NODE_ENV=production
ENV PORT=3333

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

# Copia dependências de produção do stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copia build do stage builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copia package.json para scripts
COPY package.json ./

# Copia script de inicialização
COPY scripts/start-production.sh ./scripts/
RUN chmod +x ./scripts/start-production.sh

# Define ownership
RUN chown -R fastify:nodejs /app

# Muda para usuário não-root
USER fastify

# Expõe porta
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/health/live || exit 1

# Comando de inicialização (roda migrations e inicia servidor)
CMD ["./scripts/start-production.sh"]
