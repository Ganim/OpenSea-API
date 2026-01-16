# Plano de Melhorias - OpenSea-API

## Visão Geral

Este documento detalha o planejamento completo para resolver os problemas identificados na análise do sistema, organizados em fases de curto, médio e longo prazo.

**Score Atual:** 7.5/10
**Score Alvo:** 9.5/10

---

## Fase 1: Curto Prazo (2-4 semanas)

### 1.1 Implementar Redis para Cache Distribuído

**Problema:** Cache apenas in-memory, não escalável para múltiplas instâncias.

**Solução:**

```bash
# Dependências necessárias
npm install ioredis @fastify/redis
npm install -D @types/ioredis
```

**Arquivos a criar/modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/redis.ts` | Criar | Cliente Redis singleton |
| `src/config/redis.ts` | Criar | Configurações do Redis |
| `src/@env/index.ts` | Modificar | Adicionar variáveis REDIS_* |
| `src/services/rbac/permission-service.ts` | Modificar | Migrar cache para Redis |
| `src/services/cache/cache-service.ts` | Criar | Serviço genérico de cache |
| `docker-compose.yml` | Modificar | Adicionar container Redis |

**Estrutura do Cache Service:**

```typescript
// src/services/cache/cache-service.ts
interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<void>
  invalidateUser(userId: string): Promise<void>
}
```

**Chaves de cache sugeridas:**
- `permissions:user:{userId}` - Permissões do usuário (TTL: 5min)
- `session:{sessionId}` - Dados da sessão (TTL: 30min)
- `user:{userId}` - Dados básicos do usuário (TTL: 10min)
- `rate-limit:{ip}:{endpoint}` - Rate limiting distribuído

**Estimativa:** 3-4 dias

---

### 1.2 Adicionar Endpoint /health

**Problema:** Sem endpoint para verificar saúde da aplicação.

**Solução:**

**Arquivos a criar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/http/controllers/core/health/routes.ts` | Criar | Rotas de health check |
| `src/http/controllers/core/health/v1-health-check.controller.ts` | Criar | Controller principal |
| `src/http/controllers/core/health/v1-readiness-check.controller.ts` | Criar | Readiness probe |
| `src/http/controllers/core/health/v1-liveness-check.controller.ts` | Criar | Liveness probe |

**Endpoints:**

```typescript
// GET /health - Health check básico (público, sem rate limit)
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  version: string,
  uptime: number
}

// GET /health/ready - Readiness probe (para K8s)
{
  status: 'ready' | 'not_ready',
  checks: {
    database: { status: 'up' | 'down', latency: number },
    redis: { status: 'up' | 'down', latency: number }
  }
}

// GET /health/live - Liveness probe (para K8s)
{
  status: 'alive',
  timestamp: string
}
```

**Estimativa:** 1 dia

---

### 1.3 Implementar Circuit Breaker

**Problema:** Falhas em BD não param requisições, causando cascata de erros.

**Solução:**

```bash
npm install opossum
npm install -D @types/opossum
```

**Arquivos a criar/modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/circuit-breaker.ts` | Criar | Factory de circuit breakers |
| `src/config/circuit-breaker.ts` | Criar | Configurações |
| `src/repositories/stock/prisma/prisma-products-repository.ts` | Modificar | Aplicar circuit breaker |

**Configuração:**

```typescript
// src/config/circuit-breaker.ts
export const circuitBreakerConfig = {
  database: {
    timeout: 5000,           // 5s timeout
    errorThresholdPercentage: 50,
    resetTimeout: 30000,     // 30s antes de tentar novamente
    volumeThreshold: 10,     // Mínimo de requests antes de abrir
  },
  external: {
    timeout: 10000,
    errorThresholdPercentage: 60,
    resetTimeout: 60000,
    volumeThreshold: 5,
  }
}
```

**Uso:**

```typescript
// src/lib/circuit-breaker.ts
import CircuitBreaker from 'opossum'

export function createDatabaseCircuitBreaker<T>(
  operation: () => Promise<T>,
  name: string
): CircuitBreaker<[], T> {
  const breaker = new CircuitBreaker(operation, {
    ...circuitBreakerConfig.database,
    name,
  })

  breaker.on('open', () => {
    errorLogger.error({ circuit: name }, 'Circuit breaker opened')
  })

  breaker.on('halfOpen', () => {
    httpLogger.info({ circuit: name }, 'Circuit breaker half-open')
  })

  breaker.on('close', () => {
    httpLogger.info({ circuit: name }, 'Circuit breaker closed')
  })

  return breaker
}
```

**Estimativa:** 2-3 dias

---

### 1.4 Adicionar Helmet Middleware

**Problema:** Headers de segurança não configurados.

**Solução:**

```bash
npm install @fastify/helmet
```

**Arquivo a modificar:**

```typescript
// src/app.ts
import helmet from '@fastify/helmet'

app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Para Swagger UI
      scriptSrc: ["'self'", "'unsafe-inline'"], // Para Swagger UI
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Para Swagger UI funcionar
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})
```

**Estimativa:** 0.5 dia

---

### 1.5 Validação de CPF/CNPJ com Algoritmo

**Problema:** Validação apenas por formato, sem verificar dígitos.

**Solução:**

```bash
npm install cpf-cnpj-validator
```

**Arquivos a modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/entities/domain/value-objects/cpf.ts` | Criar/Modificar | Value Object com validação |
| `src/entities/domain/value-objects/cnpj.ts` | Criar/Modificar | Value Object com validação |
| `src/http/schemas/common.schema.ts` | Modificar | Schemas Zod com refinamento |

**Implementação:**

```typescript
// src/entities/domain/value-objects/cpf.ts
import { cpf as cpfValidator } from 'cpf-cnpj-validator'

export class CPF {
  private constructor(private readonly value: string) {}

  static create(value: string): CPF {
    const cleaned = value.replace(/\D/g, '')

    if (!cpfValidator.isValid(cleaned)) {
      throw new InvalidCPFError(value)
    }

    return new CPF(cleaned)
  }

  toString(): string {
    return this.value
  }

  toFormatted(): string {
    return cpfValidator.format(this.value)
  }
}

// src/http/schemas/common.schema.ts
export const cpfSchema = z.string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => cpfValidator.isValid(val), {
    message: 'CPF inválido'
  })

export const cnpjSchema = z.string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => cnpjValidator.isValid(val), {
    message: 'CNPJ inválido'
  })
```

**Estimativa:** 1 dia

---

### 1.6 Melhorias no CI/CD

**Problema:** Pipeline básica sem lint, coverage e com inconsistências.

**Arquivos a modificar:**

| Arquivo | Ação |
|---------|------|
| `.github/workflows/run-unit-tests.yml` | Modificar |
| `.github/workflows/run-e2e-tests.yml` | Modificar |
| `.github/workflows/lint.yml` | Criar |

**Nova pipeline de lint:**

```yaml
# .github/workflows/lint.yml
name: Lint & Format

on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx prettier --check "src/**/*.ts"
```

**Pipeline de testes melhorada:**

```yaml
# .github/workflows/run-unit-tests.yml
name: Unit Tests

on:
  push:
    branches: ['*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
          minimum_coverage: 70
```

**Estimativa:** 1 dia

---

## Resumo Fase 1

| Item | Estimativa | Prioridade |
|------|------------|------------|
| 1.1 Redis Cache | 3-4 dias | Alta |
| 1.2 Health Check | 1 dia | Alta |
| 1.3 Circuit Breaker | 2-3 dias | Alta |
| 1.4 Helmet | 0.5 dia | Média |
| 1.5 CPF/CNPJ Validação | 1 dia | Média |
| 1.6 CI/CD Melhorias | 1 dia | Média |

**Total Fase 1:** ~9-11 dias úteis

---

## Fase 2: Médio Prazo (1-2 meses)

### 2.1 Migrar JWT de HS256 para RS256

**Problema:** HS256 é simétrico, dificulta escalabilidade e microserviços.

**Solução:**

**Arquivos a criar/modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/config/jwt.ts` | Criar | Configuração centralizada JWT |
| `src/@env/index.ts` | Modificar | Adicionar JWT_PRIVATE_KEY, JWT_PUBLIC_KEY |
| `src/app.ts` | Modificar | Configurar JWT com RS256 |
| `scripts/generate-jwt-keys.ts` | Criar | Script para gerar keypair |

**Geração de chaves:**

```typescript
// scripts/generate-jwt-keys.ts
import { generateKeyPairSync } from 'crypto'
import { writeFileSync } from 'fs'

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

writeFileSync('keys/private.pem', privateKey)
writeFileSync('keys/public.pem', publicKey)

console.log('Keys generated successfully!')
```

**Configuração:**

```typescript
// src/config/jwt.ts
export const jwtConfig = {
  algorithm: 'RS256' as const,
  expiresIn: '30m',
  issuer: 'opensea-api',
  audience: 'opensea-client',
}

// src/app.ts
app.register(fastifyJwt, {
  secret: {
    private: env.JWT_PRIVATE_KEY,
    public: env.JWT_PUBLIC_KEY,
  },
  sign: {
    algorithm: jwtConfig.algorithm,
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
  },
  verify: {
    algorithms: [jwtConfig.algorithm],
    issuer: jwtConfig.issuer,
  },
})
```

**Migração gradual:**
1. Adicionar suporte a RS256 mantendo HS256
2. Novos tokens usam RS256
3. Tokens HS256 continuam válidos até expirar
4. Após período de migração, remover HS256

**Estimativa:** 3-4 dias

---

### 2.2 Implementar Sistema de Filas com BullMQ

**Problema:** Workers sem retry, sem distributed locks, sem monitoring.

**Solução:**

```bash
npm install bullmq
```

**Arquivos a criar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/queue.ts` | Criar | Configuração do BullMQ |
| `src/workers/queues/notification-queue.ts` | Criar | Fila de notificações |
| `src/workers/queues/email-queue.ts` | Criar | Fila de emails |
| `src/workers/queues/audit-queue.ts` | Criar | Fila de auditoria |
| `src/workers/processors/notification-processor.ts` | Criar | Processador |
| `src/workers/processors/email-processor.ts` | Criar | Processador |

**Estrutura:**

```typescript
// src/lib/queue.ts
import { Queue, Worker, QueueEvents } from 'bullmq'
import { redis } from './redis'

export function createQueue<T>(name: string) {
  return new Queue<T>(name, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  })
}

export function createWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  concurrency = 5
) {
  return new Worker<T>(name, processor, {
    connection: redis,
    concurrency,
    limiter: {
      max: 100,
      duration: 1000,
    },
  })
}
```

**Filas a implementar:**

| Fila | Descrição | Concurrency |
|------|-----------|-------------|
| `notifications` | Envio de notificações | 10 |
| `emails` | Envio de emails | 5 |
| `audit-logs` | Gravação de audit logs | 20 |
| `reports` | Geração de relatórios | 2 |

**Dashboard (opcional):**

```bash
npm install @bull-board/fastify @bull-board/api
```

```typescript
// src/http/plugins/bull-board.plugin.ts
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

export async function bullBoardPlugin(app: FastifyInstance) {
  const serverAdapter = new FastifyAdapter()

  createBullBoard({
    queues: [
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(auditQueue),
    ],
    serverAdapter,
  })

  serverAdapter.setBasePath('/admin/queues')
  app.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' })
}
```

**Estimativa:** 5-7 dias

---

### 2.3 Cursor-Based Pagination

**Problema:** Offset/limit ineficiente para grandes datasets.

**Solução:**

**Arquivos a criar/modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/http/schemas/pagination.schema.ts` | Criar | Schemas de paginação |
| `src/repositories/base/paginated-repository.ts` | Criar | Repository base |
| `src/http/controllers/stock/products/v1-list-products.controller.ts` | Modificar | Exemplo |

**Implementação:**

```typescript
// src/http/schemas/pagination.schema.ts
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
})

export const cursorPaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      startCursor: z.string().nullable(),
      endCursor: z.string().nullable(),
      totalCount: z.number().optional(), // Opcional, evita COUNT em datasets grandes
    }),
  })

// src/repositories/base/paginated-repository.ts
interface CursorPaginationParams {
  cursor?: string
  limit: number
  direction: 'forward' | 'backward'
}

interface CursorPaginatedResult<T> {
  data: T[]
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export async function paginateWithCursor<T extends { id: string }>(
  query: PrismaQuery,
  params: CursorPaginationParams
): Promise<CursorPaginatedResult<T>> {
  const { cursor, limit, direction } = params

  const items = await query.findMany({
    take: limit + 1, // +1 para verificar se há próxima página
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Pula o cursor atual
    }),
    orderBy: { createdAt: direction === 'forward' ? 'desc' : 'asc' },
  })

  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, -1) : items

  return {
    data,
    hasNextPage: direction === 'forward' ? hasMore : !!cursor,
    hasPreviousPage: direction === 'forward' ? !!cursor : hasMore,
    startCursor: data[0]?.id ?? null,
    endCursor: data[data.length - 1]?.id ?? null,
  }
}
```

**Estratégia de migração:**
1. Adicionar cursor pagination como alternativa
2. Manter offset/limit para compatibilidade
3. Documentar ambos no Swagger
4. Deprecar offset/limit gradualmente

**Estimativa:** 4-5 dias

---

### 2.4 Integrar Sentry para Monitoramento

**Problema:** Sem captura centralizada de erros e performance.

**Solução:**

```bash
npm install @sentry/node
```

**Arquivos a criar/modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/sentry.ts` | Criar | Configuração Sentry |
| `src/@env/index.ts` | Modificar | Adicionar SENTRY_DSN |
| `src/app.ts` | Modificar | Integrar Sentry |
| `src/@errors/error-handler.ts` | Modificar | Capturar erros |

**Implementação:**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/node'
import { env } from '@/@env'

export function initSentry() {
  if (!env.SENTRY_DSN) return

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: `opensea-api@${process.env.npm_package_version}`,

    // Performance
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,

    // Filtering
    ignoreErrors: [
      'UnauthorizedError',
      'ForbiddenError',
      'ResourceNotFoundError',
    ],

    beforeSend(event, hint) {
      // Sanitizar dados sensíveis
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      return event
    },
  })
}

// src/@errors/error-handler.ts
import * as Sentry from '@sentry/node'

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  // Capturar erro no Sentry (exceto erros esperados)
  if (!(error instanceof BadRequestError) &&
      !(error instanceof UnauthorizedError) &&
      !(error instanceof ForbiddenError) &&
      !(error instanceof ResourceNotFoundError)) {
    Sentry.captureException(error, {
      user: { id: request.user?.sub },
      tags: {
        endpoint: request.url,
        method: request.method,
      },
      extra: {
        body: request.body,
        params: request.params,
        query: request.query,
      },
    })
  }

  // ... resto do handler
}
```

**Estimativa:** 2 dias

---

### 2.5 Escopo de Recurso em RBAC

**Problema:** RBAC verifica apenas código de permissão, não recurso específico.

**Solução:**

**Arquivos a modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `prisma/schema.prisma` | Modificar | Adicionar resourceScope |
| `src/services/rbac/permission-service.ts` | Modificar | Verificar escopo |
| `src/http/middlewares/rbac/verify-permission.ts` | Modificar | Passar resourceId |

**Schema atualizado:**

```prisma
model UserDirectPermission {
  id           String    @id @default(uuid())
  userId       String
  permissionId String
  resourceType String?   // 'company', 'department', 'product', etc.
  resourceId   String?   // ID específico ou '*' para todos
  grantedBy    String
  grantedAt    DateTime  @default(now())
  expiresAt    DateTime?

  user       User       @relation(fields: [userId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])

  @@index([userId, permissionId, resourceType, resourceId])
}
```

**Verificação:**

```typescript
// src/services/rbac/permission-service.ts
async checkPermission(
  userId: string,
  permissionCode: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  const userPermissions = await this.getUserPermissions(userId)

  // 1. Verificar permissão global
  const globalPermission = userPermissions.find(p =>
    this.matchesPermission(p.code, permissionCode) &&
    !p.resourceType
  )
  if (globalPermission) return true

  // 2. Verificar permissão com escopo
  if (resourceType && resourceId) {
    const scopedPermission = userPermissions.find(p =>
      this.matchesPermission(p.code, permissionCode) &&
      p.resourceType === resourceType &&
      (p.resourceId === '*' || p.resourceId === resourceId)
    )
    if (scopedPermission) return true
  }

  return false
}

// Uso no middleware
const verifyProductPermission = createPermissionMiddleware({
  permission: 'stock.products.update',
  getResourceScope: (request) => ({
    type: 'product',
    id: request.params.productId,
  }),
})
```

**Estimativa:** 4-5 dias

---

### 2.6 Request ID e Correlation

**Problema:** Logs não correlacionados entre serviços/requests.

**Solução:**

```bash
npm install @fastify/request-context uuid
```

**Arquivos a criar/modificar:**

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/http/plugins/request-id.plugin.ts` | Criar | Plugin de request ID |
| `src/lib/logger.ts` | Modificar | Incluir request ID |
| `src/app.ts` | Modificar | Registrar plugin |

**Implementação:**

```typescript
// src/http/plugins/request-id.plugin.ts
import { randomUUID } from 'crypto'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string
  }
}

const requestIdPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const requestId = request.headers['x-request-id'] as string || randomUUID()
    request.requestId = requestId
    reply.header('x-request-id', requestId)
  })
}

export default fp(requestIdPlugin, { name: 'request-id' })

// src/lib/logger.ts - modificado
export function createContextLogger(request: FastifyRequest) {
  return logger.child({
    requestId: request.requestId,
    userId: request.user?.sub,
    ip: request.ip,
    method: request.method,
    url: request.url,
  })
}
```

**Estimativa:** 1-2 dias

---

## Resumo Fase 2

| Item | Estimativa | Prioridade |
|------|------------|------------|
| 2.1 JWT RS256 | 3-4 dias | Alta |
| 2.2 BullMQ | 5-7 dias | Alta |
| 2.3 Cursor Pagination | 4-5 dias | Média |
| 2.4 Sentry | 2 dias | Alta |
| 2.5 RBAC Resource Scope | 4-5 dias | Média |
| 2.6 Request ID | 1-2 dias | Média |

**Total Fase 2:** ~20-25 dias úteis

---

## Fase 3: Longo Prazo (2-3 meses)

### 3.1 Documentação Completa

**Arquivos a criar:**

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documentação principal do projeto |
| `CONTRIBUTING.md` | Guia de contribuição |
| `docs/ARCHITECTURE.md` | Documentação de arquitetura |
| `docs/adr/` | Architecture Decision Records |
| `docs/api/` | Documentação adicional da API |
| `docs/deployment/` | Guias de deploy |
| `docs/runbooks/` | Procedimentos operacionais |

**README.md sugerido:**

```markdown
# OpenSea-API

Sistema de gestão de estoque e vendas.

## Stack Tecnológico
- Node.js 22+ / TypeScript 5.8
- Fastify 5.x
- Prisma 6.x (PostgreSQL)
- Redis (Cache/Queues)
- BullMQ (Background Jobs)

## Quick Start

### Pré-requisitos
- Node.js 22+
- Docker e Docker Compose
- PostgreSQL 15+
- Redis 7+

### Instalação
\`\`\`bash
# Clone o repositório
git clone https://github.com/org/opensea-api.git
cd opensea-api

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env

# Inicie os serviços
docker-compose up -d

# Execute as migrations
npm run prisma:migrate

# Inicie o servidor
npm run dev
\`\`\`

## Scripts Disponíveis
| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor em modo desenvolvimento |
| `npm run build` | Build de produção |
| `npm run test` | Testes unitários |
| `npm run test:e2e` | Testes E2E |

## Arquitetura
Ver [ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Contribuindo
Ver [CONTRIBUTING.md](CONTRIBUTING.md)

## License
MIT
```

**ADR Template:**

```markdown
# ADR-001: Uso de Clean Architecture

## Status
Aceito

## Contexto
Precisamos de uma arquitetura que permita...

## Decisão
Adotamos Clean Architecture porque...

## Consequências
### Positivas
- ...

### Negativas
- ...
```

**Estimativa:** 5-7 dias

---

### 3.2 Testes de Carga

**Ferramentas:**
- k6 para testes de performance
- Artillery como alternativa

```bash
npm install -D k6 @types/k6
```

**Arquivos a criar:**

| Arquivo | Descrição |
|---------|-----------|
| `tests/load/scenarios/` | Cenários de teste |
| `tests/load/k6.config.js` | Configuração k6 |
| `tests/load/smoke.js` | Teste de fumaça |
| `tests/load/stress.js` | Teste de estresse |
| `tests/load/spike.js` | Teste de pico |

**Exemplo de teste:**

```javascript
// tests/load/scenarios/auth-flow.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Sustain
    { duration: '2m', target: 200 },  // Spike
    { duration: '5m', target: 200 },  // Sustain spike
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% failed
  },
}

export default function () {
  // Login
  const loginRes = http.post(`${__ENV.BASE_URL}/v1/auth/login/password`, {
    email: 'test@example.com',
    password: 'Pass@123',
  })

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  })

  const token = loginRes.json('token')

  // List products
  const productsRes = http.get(`${__ENV.BASE_URL}/v1/products`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  check(productsRes, {
    'products listed': (r) => r.status === 200,
  })

  sleep(1)
}
```

**Script npm:**

```json
{
  "scripts": {
    "test:load": "k6 run tests/load/scenarios/auth-flow.js",
    "test:load:smoke": "k6 run tests/load/smoke.js",
    "test:load:stress": "k6 run tests/load/stress.js"
  }
}
```

**Estimativa:** 5-7 dias

---

### 3.3 Testes de Segurança (SAST/DAST)

**Ferramentas:**

| Ferramenta | Tipo | Uso |
|------------|------|-----|
| Snyk | SAST | Vulnerabilidades em deps |
| SonarQube | SAST | Análise de código |
| OWASP ZAP | DAST | Scan de vulnerabilidades |
| npm audit | SAST | Vulnerabilidades npm |

**GitHub Actions para Snyk:**

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Segunda-feira à meia-noite

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm audit --audit-level=high

  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: typescript
      - uses: github/codeql-action/analyze@v3
```

**OWASP ZAP Scan:**

```yaml
# .github/workflows/zap-scan.yml
name: OWASP ZAP Scan

on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0' # Domingo 2am

jobs:
  zap:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: docker
          POSTGRES_DB: opensea-test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - run: npm start &
        env:
          DATABASE_URL: postgresql://postgres:docker@localhost:5432/opensea-test
      - name: Wait for server
        run: sleep 10
      - uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:3333'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

**Estimativa:** 5-7 dias

---

### 3.4 Rate Limiting por Usuário

**Problema:** Rate limit apenas por IP, não por usuário autenticado.

**Solução:**

**Arquivos a modificar:**

| Arquivo | Ação |
|---------|------|
| `src/config/rate-limits.ts` | Modificar |
| `src/http/plugins/rate-limit.plugin.ts` | Criar |

**Implementação:**

```typescript
// src/http/plugins/rate-limit.plugin.ts
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { redis } from '@/lib/redis'

interface UserRateLimitConfig {
  anonymous: number      // Requests/min para não autenticados
  authenticated: number  // Requests/min para autenticados
  premium: number        // Requests/min para usuários premium
}

const config: UserRateLimitConfig = {
  anonymous: 60,
  authenticated: 200,
  premium: 500,
}

const userRateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    const userId = request.user?.sub
    const userTier = request.user?.tier || 'anonymous'

    const key = userId
      ? `rate-limit:user:${userId}`
      : `rate-limit:ip:${request.ip}`

    const limit = config[userTier as keyof UserRateLimitConfig]
    const window = 60 // 1 minuto

    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, window)
    }

    const remaining = Math.max(0, limit - current)
    const resetAt = await redis.ttl(key)

    reply.header('X-RateLimit-Limit', limit)
    reply.header('X-RateLimit-Remaining', remaining)
    reply.header('X-RateLimit-Reset', Date.now() + resetAt * 1000)

    if (current > limit) {
      reply.status(429).send({
        error: 'Too Many Requests',
        retryAfter: resetAt,
      })
    }
  })
}

export default fp(userRateLimitPlugin, { name: 'user-rate-limit' })
```

**Estimativa:** 2-3 dias

---

### 3.5 Audit Log com Assinatura HMAC

**Problema:** Audit logs podem ser falsificados.

**Solução:**

**Arquivos a modificar:**

| Arquivo | Ação |
|---------|------|
| `prisma/schema.prisma` | Adicionar campo signature |
| `src/services/audit/audit-service.ts` | Criar/Modificar |
| `src/use-cases/audit/verify-audit-integrity.ts` | Criar |

**Implementação:**

```typescript
// src/services/audit/audit-service.ts
import { createHmac } from 'crypto'
import { env } from '@/@env'

interface AuditLogData {
  userId: string
  entityId: string
  action: string
  module: string
  newData?: object
  oldData?: object
  metadata?: object
  createdAt: Date
}

export class AuditService {
  private readonly hmacSecret = env.AUDIT_HMAC_SECRET

  async createAuditLog(data: AuditLogData): Promise<AuditLog> {
    const signature = this.generateSignature(data)

    return prisma.auditLog.create({
      data: {
        ...data,
        signature,
      },
    })
  }

  async verifyIntegrity(auditLogId: string): Promise<boolean> {
    const log = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    })

    if (!log) return false

    const expectedSignature = this.generateSignature({
      userId: log.userId,
      entityId: log.entityId,
      action: log.action,
      module: log.module,
      newData: log.newData,
      oldData: log.oldData,
      metadata: log.metadata,
      createdAt: log.createdAt,
    })

    return log.signature === expectedSignature
  }

  async verifyChainIntegrity(fromDate: Date, toDate: Date): Promise<{
    valid: boolean
    invalidLogs: string[]
  }> {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { createdAt: 'asc' },
    })

    const invalidLogs: string[] = []

    for (const log of logs) {
      const isValid = await this.verifyIntegrity(log.id)
      if (!isValid) {
        invalidLogs.push(log.id)
      }
    }

    return {
      valid: invalidLogs.length === 0,
      invalidLogs,
    }
  }

  private generateSignature(data: AuditLogData): string {
    const payload = JSON.stringify({
      userId: data.userId,
      entityId: data.entityId,
      action: data.action,
      module: data.module,
      newData: data.newData,
      oldData: data.oldData,
      metadata: data.metadata,
      createdAt: data.createdAt.toISOString(),
    })

    return createHmac('sha256', this.hmacSecret)
      .update(payload)
      .digest('hex')
  }
}
```

**Endpoint de verificação:**

```typescript
// GET /v1/audit/verify-integrity
// POST /v1/audit/verify-chain
```

**Estimativa:** 3-4 dias

---

### 3.6 Database Optimization

**Tarefas:**

1. **Análise de queries lentas**
2. **Criação de índices otimizados**
3. **Implementação de índices parciais**
4. **Configuração de vacuum/analyze**

**Script de análise:**

```sql
-- queries_lentas.sql
-- Identificar queries lentas
SELECT
  query,
  calls,
  mean_time,
  total_time,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Índices não utilizados
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';

-- Tabelas sem índices
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_tup_read DESC;
```

**Índices recomendados:**

```prisma
// prisma/schema.prisma - adicionar

model AuditLog {
  // ... campos existentes

  @@index([createdAt(sort: Desc)])
  @@index([module, action, createdAt])
  @@index([userId, createdAt])
}

model Product {
  // ... campos existentes

  @@index([status, createdAt(sort: Desc)])
  @@index([categoryId, status])
}

model SalesOrder {
  // ... campos existentes

  @@index([status, createdAt(sort: Desc)])
  @@index([customerId, status])
}
```

**Estimativa:** 5-7 dias

---

### 3.7 Containerização Completa

**Arquivos a criar:**

| Arquivo | Descrição |
|---------|-----------|
| `Dockerfile` | Build da aplicação |
| `Dockerfile.worker` | Build do worker |
| `docker-compose.yml` | Atualizado |
| `docker-compose.prod.yml` | Produção |
| `.dockerignore` | Arquivos ignorados |

**Dockerfile:**

```dockerfile
# Dockerfile
FROM node:22-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER fastify

EXPOSE 3333

CMD ["node", "build/server.js"]
```

**docker-compose.yml atualizado:**

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3333:3333'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://docker:docker@postgres:5432/apiopensea
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '-q', '--spider', 'http://localhost:3333/health']
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://docker:docker@postgres:5432/apiopensea
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: bitnami/postgresql:15
    environment:
      - POSTGRESQL_USERNAME=docker
      - POSTGRESQL_PASSWORD=docker
      - POSTGRESQL_DATABASE=apiopensea
    volumes:
      - postgres_data:/bitnami/postgresql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U docker -d apiopensea']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Estimativa:** 3-4 dias

---

## Resumo Fase 3

| Item | Estimativa | Prioridade |
|------|------------|------------|
| 3.1 Documentação | 5-7 dias | Alta |
| 3.2 Testes de Carga | 5-7 dias | Média |
| 3.3 Testes de Segurança | 5-7 dias | Alta |
| 3.4 Rate Limit por Usuário | 2-3 dias | Média |
| 3.5 Audit com HMAC | 3-4 dias | Baixa |
| 3.6 Database Optimization | 5-7 dias | Média |
| 3.7 Containerização | 3-4 dias | Média |

**Total Fase 3:** ~30-40 dias úteis

---

## Cronograma Consolidado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CRONOGRAMA DE IMPLEMENTAÇÃO                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 1 - CURTO PRAZO (Semanas 1-4)                                         │
│  ══════════════════════════════════                                         │
│                                                                              │
│  Semana 1:                                                                   │
│  ├── [1.1] Redis Cache ████████████████████                                 │
│  └── [1.2] Health Check ████                                                │
│                                                                              │
│  Semana 2:                                                                   │
│  ├── [1.1] Redis Cache (cont.) ████████                                     │
│  └── [1.3] Circuit Breaker ████████████████                                 │
│                                                                              │
│  Semana 3:                                                                   │
│  ├── [1.3] Circuit Breaker (cont.) ████████                                 │
│  ├── [1.4] Helmet ████                                                      │
│  └── [1.5] CPF/CNPJ Validação ████████                                      │
│                                                                              │
│  Semana 4:                                                                   │
│  ├── [1.6] CI/CD Melhorias ████████                                         │
│  └── [    ] Buffer/Revisão ████████████████                                 │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  FASE 2 - MÉDIO PRAZO (Semanas 5-10)                                        │
│  ═══════════════════════════════════                                        │
│                                                                              │
│  Semana 5:                                                                   │
│  └── [2.1] JWT RS256 ████████████████████                                   │
│                                                                              │
│  Semanas 6-7:                                                                │
│  └── [2.2] BullMQ ████████████████████████████████████████                  │
│                                                                              │
│  Semana 8:                                                                   │
│  ├── [2.3] Cursor Pagination ████████████████████                           │
│  └── [2.4] Sentry ████████                                                  │
│                                                                              │
│  Semanas 9-10:                                                               │
│  ├── [2.5] RBAC Resource Scope ████████████████████                         │
│  └── [2.6] Request ID ████████                                              │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  FASE 3 - LONGO PRAZO (Semanas 11-20)                                       │
│  ════════════════════════════════════                                       │
│                                                                              │
│  Semanas 11-12:                                                              │
│  └── [3.1] Documentação ████████████████████████████                        │
│                                                                              │
│  Semanas 13-14:                                                              │
│  └── [3.2] Testes de Carga ████████████████████████████                     │
│                                                                              │
│  Semanas 15-16:                                                              │
│  └── [3.3] Testes de Segurança ████████████████████████████                 │
│                                                                              │
│  Semana 17:                                                                  │
│  ├── [3.4] Rate Limit por Usuário ████████████                              │
│  └── [3.5] Audit com HMAC ████████████████                                  │
│                                                                              │
│  Semanas 18-19:                                                              │
│  └── [3.6] Database Optimization ████████████████████████████               │
│                                                                              │
│  Semana 20:                                                                  │
│  └── [3.7] Containerização ████████████████████                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Dependências entre Tarefas

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRAFO DE DEPENDÊNCIAS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1.1] Redis ─────────┬──────────────────► [2.2] BullMQ         │
│                       │                                          │
│                       ├──────────────────► [3.4] Rate Limit     │
│                       │                    por Usuário           │
│                       │                                          │
│                       └──────────────────► [2.6] Request ID     │
│                                            (cache de sessão)     │
│                                                                  │
│  [1.2] Health Check ─────────────────────► [3.7] Containerização│
│                                            (healthcheck docker)  │
│                                                                  │
│  [1.3] Circuit Breaker ──────────────────► [2.4] Sentry         │
│                                            (integração)          │
│                                                                  │
│  [2.1] JWT RS256 ────────────────────────► [3.3] Testes Segurança│
│                                            (verificação)         │
│                                                                  │
│  [2.5] RBAC Scope ───────────────────────► [3.5] Audit HMAC     │
│                                            (escopo em audit)     │
│                                                                  │
│  [3.1] Documentação ─────────────────────► [3.2] Testes Carga   │
│                                            (docs de cenários)    │
│                                                                  │
│  INDEPENDENTES (podem ser paralelas):                            │
│  ├── [1.4] Helmet                                               │
│  ├── [1.5] CPF/CNPJ                                             │
│  ├── [1.6] CI/CD                                                │
│  ├── [2.3] Cursor Pagination                                    │
│  └── [3.6] Database Optimization                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Métricas de Sucesso

### Fase 1
- [ ] Redis funcionando com cache de permissões
- [ ] Endpoint /health retornando status correto
- [ ] Circuit breaker abrindo após 50% de falhas
- [ ] Headers de segurança presentes (verificar com securityheaders.com)
- [ ] CPF/CNPJ validando dígitos verificadores
- [ ] CI/CD com lint e coverage

### Fase 2
- [ ] JWT com RS256 em produção
- [ ] Filas processando jobs com retry
- [ ] Cursor pagination em endpoints de volume
- [ ] Erros capturados no Sentry
- [ ] RBAC verificando resource scope
- [ ] Request ID em todos os logs

### Fase 3
- [ ] README completo e ADRs documentados
- [ ] Testes de carga passando thresholds
- [ ] Zero vulnerabilidades high/critical
- [ ] Rate limit por usuário funcionando
- [ ] Audit logs verificáveis
- [ ] Queries otimizadas (p95 < 100ms)
- [ ] Docker compose em produção

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking change JWT | Alta | Alto | Migração gradual, suporte dual |
| Performance Redis | Média | Alto | Benchmark antes de produção |
| Complexidade BullMQ | Média | Médio | Começar com fila simples |
| Falsos positivos Sentry | Alta | Baixo | Configurar ignoreErrors |
| Testes de carga incorretos | Média | Médio | Validar cenários com produção |

---

## Estimativa Total

| Fase | Dias Úteis | Semanas |
|------|------------|---------|
| Fase 1 | 9-11 | 2-3 |
| Fase 2 | 20-25 | 4-5 |
| Fase 3 | 30-40 | 6-8 |
| **Total** | **59-76** | **12-16** |

**Investimento estimado:** 3-4 meses de desenvolvimento focado

---

## Próximos Passos

1. **Validar prioridades** com stakeholders
2. **Criar branch** `feature/infrastructure-improvements`
3. **Iniciar Fase 1.1** (Redis) imediatamente
4. **Setup de métricas** para acompanhamento
5. **Reuniões semanais** de status

---

*Documento gerado em: Janeiro 2026*
*Versão: 1.0*
