# Plano de Melhoria Técnica — OpenSea Platform

**Objetivo:** Elevar todas as dimensões técnicas para nota ≥ 9.0
**Nota atual:** 7.3/10 → **Alvo: 9.0/10**
**Estimativa total:** ~120h de trabalho (6 sprints de 2 semanas)

---

## Visão Geral das Fases

| Fase | Foco | Impacto | Esforço | Dimensões Afetadas |
|------|------|---------|---------|-------------------|
| **1** | Quick Wins | +0.8 nota geral | ~15h | 5, 6, 14, 15, 17 |
| **2** | Performance & Dados | +0.4 nota geral | ~20h | 7, 16 |
| **3** | Observabilidade | +0.3 nota geral | ~15h | 10, 18 |
| **4** | API & Segurança | +0.3 nota geral | ~20h | 2, 4 |
| **5** | Infraestrutura | +0.3 nota geral | ~25h | 11, 12, 13 |
| **6** | Arquitetura & Frontend | +0.3 nota geral | ~25h | 1, 8, 9 |

---

## Fase 1 — Quick Wins (Sprint 1)

> Itens de alto impacto, baixo esforço. Elevam várias dimensões rapidamente.

### 1.1 — Conventional Commits + Commitlint (DX: 8→9)

**Esforço:** 1h

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
echo "module.exports = { extends: ['@commitlint/config-conventional'] }" > commitlint.config.js
npx husky add .husky/commit-msg 'npx commitlint --edit "$1"'
```

**Resultado:** Commit messages padronizados, prepara para CHANGELOG automático.

---

### 1.2 — CHANGELOG Automático (Doc: 7→8, DX: 8→9)

**Esforço:** 2h

- Instalar `semantic-release` ou `standard-version`
- Configurar no CI para gerar changelog a cada merge em main
- Tags semânticas automáticas (v1.2.3)

---

### 1.3 — Coverage Mínimo no CI (Testes: 7.5→8)

**Esforço:** 2h

No `vitest.config`:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    statements: 75,
    branches: 70,
    functions: 75,
    lines: 75,
  },
}
```

No CI (`ci.yml`):
```yaml
- run: npm run test:coverage
- uses: codecov/codecov-action@v4
```

---

### 1.4 — Zerar Violações `any` (Qualidade: 7.5→8)

**Esforço:** 4h

- Corrigir ~71 violações restantes
- Substituir por `unknown`, `Record<string, unknown>`, ou tipos específicos
- Manter `eslint-disable` apenas em `entity-form.tsx` (react-hook-form constraint)

---

### 1.5 — Lighthouse CI para Acessibilidade (a11y: 5→6.5)

**Esforço:** 3h

```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      http://localhost:3000/calendar
      http://localhost:3000/stock/products
    budgetPath: ./lighthouse-budget.json
    uploadArtifacts: true
```

Budget mínimo:
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.85 }],
        "categories:performance": ["warn", { "minScore": 0.70 }]
      }
    }
  }
}
```

---

### 1.6 — htmlFor/id em Todos os Formulários (a11y: 6.5→7.5)

**Esforço:** 3h

Audit de TODOS os componentes com `<label>` sem `htmlFor`:
- Stock: product forms, variant forms, warehouse forms
- HR: employee forms, department forms
- Sales: customer forms, order forms
- Finance: entry forms, category forms
- Email: account forms
- Tasks: card create, board settings
- Admin: tenant forms, plan forms

Padrão: `id="{module}-{field}"`, `htmlFor="{module}-{field}"`

---

## Fase 2 — Performance & Integridade de Dados (Sprint 2)

### 2.1 — Resolver N+1 Queries (Perf: 6.5→7.5)

**Esforço:** 6h

**Padrão a implementar em todos os repositórios:**

```typescript
// Repository interface
findByEventAndUserList(eventId: string, userIds: string[]): Promise<Participant[]>;
createMany(data: CreateParticipantData[]): Promise<Participant[]>;

// Prisma implementation
async findByEventAndUserList(eventId: string, userIds: string[]) {
  return prisma.eventParticipant.findMany({
    where: { eventId, userId: { in: userIds } }
  });
}
```

**Módulos afetados:**
- Calendar: invite-participants, share-event-with-users, share-event-with-team
- Tasks: board members, card assignments
- HR: department members
- Stock: warehouse items batch operations

---

### 2.2 — HTTP Caching (Perf: 7.5→8)

**Esforço:** 4h

```typescript
// Plugin: src/http/plugins/cache-control.plugin.ts
app.addHook('onSend', (request, reply, payload, done) => {
  if (request.method === 'GET' && reply.statusCode === 200) {
    const isPublic = request.url.startsWith('/v1/admin/plans');
    const maxAge = isPublic ? 300 : 60; // 5min público, 1min privado

    reply.header('Cache-Control', `private, max-age=${maxAge}`);

    // ETag baseado em hash do payload
    const etag = createHash('md5').update(payload as string).digest('hex');
    reply.header('ETag', `"${etag}"`);

    if (request.headers['if-none-match'] === `"${etag}"`) {
      reply.code(304);
      return done(null, null);
    }
  }
  done(null, payload);
});
```

---

### 2.3 — Transactions em Operações Compostas (Integridade: 7.5→8.5)

**Esforço:** 6h

Identificar operações que modificam múltiplas tabelas sem transaction:

```typescript
// Padrão a aplicar:
async execute(request: Request) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.calendarEvent.create({ ... });
    await tx.eventParticipant.create({ ... }); // OWNER
    await tx.auditLog.create({ ... });
    return event;
  });
}
```

**Operações críticas:**
- Create event + add OWNER participant
- Share event + create multiple participants
- Delete board + cascade columns + cascade cards
- Create finance entry + create attachments
- Move folder + update children paths

---

### 2.4 — Idempotency Keys (Integridade: 8.5→9)

**Esforço:** 4h

```typescript
// Middleware: src/http/plugins/idempotency.plugin.ts
app.addHook('preHandler', async (request) => {
  if (['POST', 'PUT'].includes(request.method)) {
    const key = request.headers['idempotency-key'];
    if (key) {
      const cached = await redis.get(`idem:${key}`);
      if (cached) {
        return JSON.parse(cached); // Return cached response
      }
    }
  }
});

app.addHook('onSend', async (request, reply, payload) => {
  const key = request.headers['idempotency-key'];
  if (key && reply.statusCode < 400) {
    await redis.set(`idem:${key}`, payload, 'EX', 86400); // 24h
  }
});
```

---

## Fase 3 — Observabilidade (Sprint 3)

### 3.1 — Sentry Alerting Rules (Obs: 7→7.5)

**Esforço:** 2h

Configurar no Sentry dashboard:
- **Alert 1:** Error rate > 5 errors/min → Slack notification
- **Alert 2:** P95 latency > 2s por 5min → Slack warning
- **Alert 3:** Unhandled exception → Slack critical
- **Alert 4:** New error pattern (first seen) → Slack info

---

### 3.2 — Uptime Monitoring Externo (Obs: 7.5→8, Prod: 7→7.5)

**Esforço:** 1h

- Configurar Better Uptime / UptimeRobot (free tier):
  - Monitor: `https://api.opensea.fly.dev/health`
  - Monitor: `https://app.opensea.fly.dev/`
  - Interval: 1 min
  - Alert: Slack + Email

---

### 3.3 — Fly Metrics + Grafana (Obs: 8→9)

**Esforço:** 6h

Fly.io já coleta métricas Prometheus. Configurar visualização:

```toml
# fly.toml
[metrics]
  port = 9091
  path = "/metrics"
```

```typescript
// src/http/plugins/prometheus.plugin.ts
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Business metrics
const eventsCreated = new Counter({
  name: 'calendar_events_created_total',
  help: 'Total calendar events created',
  labelNames: ['tenant', 'type'],
});
```

Dashboard Grafana com:
- Request rate, latency P50/P95/P99
- Error rate by endpoint
- Database query latency
- Queue depth e processing rate
- Memory/CPU usage
- Business metrics (events/day, active users)

---

### 3.4 — SLOs Definidos (Obs: 9→9, Prod: 7.5→8)

**Esforço:** 2h

Criar `docs/slos.md`:

| SLI | Métrica | SLO | Medição |
|-----|---------|-----|---------|
| Availability | % requests com status < 500 | 99.9% | 30-day rolling |
| Latency | P95 response time | < 500ms | Per endpoint |
| Error Rate | % requests 5xx | < 0.1% | 30-day rolling |
| Queue Latency | P95 job wait time | < 30s | Per queue |

---

### 3.5 — Structured Error Codes (Erros: 8.5→9.5)

**Esforço:** 4h

```typescript
// src/@errors/error-codes.ts
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',

  // Domain-specific
  CALENDAR_NOT_FOUND: 'CALENDAR_NOT_FOUND',
  EVENT_OVERLAP: 'EVENT_OVERLAP',
  CROSS_TENANT: 'CROSS_TENANT',
  SYSTEM_EVENT_READONLY: 'SYSTEM_EVENT_READONLY',
  // ...
} as const;

// Error response shape
interface ErrorResponse {
  code: string;      // Machine-readable
  message: string;   // Human-readable
  requestId: string; // For tracing
  details?: unknown; // Validation details
}
```

---

## Fase 4 — API & Segurança (Sprint 4)

### 4.1 — Named Swagger Schemas (API: 8→9)

**Esforço:** 8h

```typescript
// src/http/schemas/shared/register-schemas.ts
export function registerSwaggerSchemas(app: FastifyInstance) {
  app.addSchema({
    $id: 'CalendarEvent',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      // ...
    },
  });

  app.addSchema({
    $id: 'PaginationMeta',
    type: 'object',
    properties: {
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
      pages: { type: 'number' },
    },
  });
}
```

**Resultado:** Swagger UI com tipos navegáveis, API client auto-gerado funcional.

---

### 4.2 — verifyModule em TODOS os Módulos (Seg: 8→8.5)

**Esforço:** 2h

Audit de todas as rotas:

| Módulo | verifyModule | Status |
|--------|-------------|--------|
| Calendar | ✅ CALENDAR | Feito |
| Stock | ❓ STOCK | Verificar |
| HR | ❓ HR | Verificar |
| Sales | ❓ SALES | Verificar |
| Finance | ❓ FINANCE | Verificar |
| Storage | ❓ STORAGE | Verificar |
| Email | ❓ EMAIL | Verificar |
| Tasks | ❓ TASKS | Verificar |
| RBAC | ❓ (CORE?) | Verificar |

---

### 4.3 — Refresh Token Rotation (Seg: 8.5→9)

**Esforço:** 4h

```typescript
// POST /v1/auth/refresh
// 1. Validate refresh token
// 2. Check if token was already used (rotation detection)
// 3. If reused → invalidate ALL tokens for this user (compromise detected)
// 4. Issue new access token + new refresh token
// 5. Store new refresh token hash, mark old as used
```

---

### 4.4 — Login Failure Rate Limiting por IP (Seg: 9→9.5)

**Esforço:** 2h

```typescript
// Já existe rate limiting de 10 req/min para auth.
// Adicionar: block IP after 10 failed logins in 15min
const loginFailures = await redis.incr(`login_fail:${ip}`);
if (loginFailures === 1) await redis.expire(`login_fail:${ip}`, 900);
if (loginFailures > 10) {
  throw new TooManyRequestsError('Too many failed login attempts');
}
```

---

### 4.5 — HSTS + Security Headers Audit (Seg: 9→9.5)

**Esforço:** 2h

```typescript
// app.ts - Helmet config update
app.register(helmet, {
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  // Keep existing CSP config
});
```

Verificar com `securityheaders.com` score A+.

---

## Fase 5 — Infraestrutura (Sprint 5)

### 5.1 — Staging Environment (DevOps: 7.5→8.5, Prod: 8→8.5)

**Esforço:** 4h

```bash
# Criar app staging no Fly.io
fly apps create opensea-api-staging
fly apps create opensea-app-staging

# fly.staging.toml
[env]
  NODE_ENV = "staging"
  FRONTEND_URL = "https://opensea-app-staging.fly.dev"
```

CI workflow:
```yaml
# Deploy staging on push to develop
on:
  push:
    branches: [develop]
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --config fly.staging.toml
```

---

### 5.2 — Horizontal Scaling (Escala: 6→7.5)

**Esforço:** 2h

```toml
# fly.toml
[http_service]
  min_machines_running = 2    # HA: always 2 instances
  auto_start_machines = true
  auto_stop_machines = "suspend"  # Suspend idle, don't destroy

[[services]]
  [services.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200
```

---

### 5.3 — Smoke Tests Pós-Deploy (DevOps: 8.5→9)

**Esforço:** 3h

```yaml
# .github/workflows/fly-deploy.yml
deploy:
  # ... existing deploy steps ...

smoke-test:
  needs: deploy
  runs-on: ubuntu-latest
  steps:
    - name: Wait for deployment
      run: sleep 30

    - name: Health check
      run: |
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://opensea-api.fly.dev/health)
        if [ "$STATUS" != "200" ]; then
          echo "Health check failed with status $STATUS"
          exit 1
        fi

    - name: API smoke test
      run: |
        npx k6 run tests/load/smoke.js \
          --env BASE_URL=https://opensea-api.fly.dev

    - name: Rollback on failure
      if: failure()
      run: flyctl releases rollback --app opensea-api
```

---

### 5.4 — Dead Letter Queue (Resiliência: 7.5→8.5)

**Esforço:** 4h

```typescript
// src/lib/queue.ts - Atualizar configuração
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { age: 86400, count: 1000 },
  removeOnFail: false, // Keep failed jobs
};

// Dead letter processor
const dlqWorker = new Worker('dead-letter', async (job) => {
  logger.error({
    queue: job.data.originalQueue,
    jobId: job.data.originalJobId,
    error: job.data.lastError,
    attempts: job.data.attempts,
  }, 'Job moved to dead letter queue');

  // Alert via Sentry
  Sentry.captureMessage(`DLQ: ${job.data.originalQueue}`, {
    level: 'warning',
    extra: job.data,
  });
});
```

---

### 5.5 — Disaster Recovery Plan (Prod: 8.5→9)

**Esforço:** 4h

Criar `docs/disaster-recovery.md`:

```markdown
## Cenários e Procedimentos

### 1. API Instance Down
- **Detecção:** Fly.io health check (15s interval)
- **Recuperação automática:** Fly.io reinicia instância
- **HA:** Min 2 instances, load balancer distribui
- **RTO:** < 30s (auto-restart)

### 2. Database Unreachable
- **Detecção:** Circuit breaker opens after 10 failed queries
- **Health endpoint:** Returns "degraded"
- **Neon backup:** Point-in-time recovery (último 7 dias)
- **RTO:** < 5min (Neon auto-failover)
- **RPO:** 0 (synchronous replication)

### 3. Redis Down
- **Degradação:** Rate limiter allows all, cache misses hit DB
- **Queue recovery:** BullMQ auto-reconnects
- **RTO:** < 2min (Fly Redis auto-restart)

### 4. Full Region Outage
- **Failover:** Manual deploy to secondary region
- **RTO:** < 30min
- **RPO:** Last Neon branch point
```

---

## Fase 6 — Arquitetura & Frontend (Sprint 6)

### 6.1 — Error Boundaries (Frontend: 7.5→8.5)

**Esforço:** 4h

```tsx
// src/components/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

Aplicar em:
- `layout.tsx` de cada route group
- Componentes que fazem fetch (CalendarView, FileManager, etc.)

---

### 6.2 — Domain Events (Arq: 8.5→9)

**Esforço:** 8h

```typescript
// src/lib/domain-events.ts
type DomainEventHandler = (event: DomainEvent) => Promise<void>;

class DomainEventBus {
  private handlers = new Map<string, DomainEventHandler[]>();

  on(eventType: string, handler: DomainEventHandler) {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async emit(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.allSettled(handlers.map(h => h(event)));
  }
}

// Events
interface EventCreated extends DomainEvent {
  type: 'calendar.event.created';
  payload: { eventId: string; tenantId: string; type: EventType };
}

interface AbsenceApproved extends DomainEvent {
  type: 'hr.absence.approved';
  payload: { absenceId: string; employeeId: string; tenantId: string };
}

// Subscriber registration
eventBus.on('hr.absence.approved', async (event) => {
  await calendarSyncService.syncAbsence(event.payload);
});
```

**Resultado:** CalendarSyncService não é mais chamado diretamente de use cases de outros módulos. Desacoplamento total.

---

### 6.3 — Suspense Boundaries + loading.tsx (Frontend: 8.5→9)

**Esforço:** 4h

```tsx
// src/app/(dashboard)/(tools)/calendar/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  );
}
```

Criar `loading.tsx` para todas as pages:
- `/calendar/loading.tsx`
- `/stock/products/loading.tsx`
- `/hr/employees/loading.tsx`
- `/finance/payable/loading.tsx`
- `/email/loading.tsx`
- `/tasks/loading.tsx`
- `/storage/loading.tsx`

---

### 6.4 — ADRs para Decisões Arquiteturais (Doc: 7→9)

**Esforço:** 5h

Criar `docs/adr/`:

```
docs/adr/
  001-clean-architecture.md
  002-multi-tenant-jwt-scoping.md
  003-rbac-permission-pattern.md
  004-prisma-repository-pattern.md
  005-bullmq-async-processing.md
  006-calendar-rrule-expansion.md
  007-storage-s3-architecture.md
  008-email-imap-sync-strategy.md
  009-circuit-breaker-adoption.md
  010-sentry-error-monitoring.md
```

Template ADR:
```markdown
# ADR-001: Clean Architecture

## Status: Accepted
## Date: 2025-XX-XX

## Context
[Why this decision was needed]

## Decision
[What was decided]

## Consequences
[Positive and negative impacts]
```

---

## Resumo de Impacto por Fase

| Fase | Antes | Depois | Dimensões |
|------|:-----:|:------:|-----------|
| Fase 1 (Quick Wins) | 7.3 | 8.1 | Qualidade, Testes, Doc, a11y, DX |
| Fase 2 (Perf & Data) | 8.1 | 8.5 | Performance, Integridade |
| Fase 3 (Observability) | 8.5 | 8.8 | Obs, Erros, Prod |
| Fase 4 (API & Seg) | 8.8 | 9.0 | Segurança, API |
| Fase 5 (Infra) | 9.0 | 9.2 | DevOps, Escala, Resiliência |
| Fase 6 (Arq & FE) | 9.2 | 9.3 | Arquitetura, Frontend, Doc |

---

## Notas Finais Projetadas (Pós Fase 6)

| # | Dimensão | Atual | Projetada |
|---|----------|:-----:|:---------:|
| 1 | Arquitetura & Design Patterns | 8.5 | **9.0** |
| 2 | Segurança | 8.0 | **9.5** |
| 3 | Banco de Dados & Schema | 8.0 | **9.0** |
| 4 | API Design & Contratos | 8.0 | **9.0** |
| 5 | Qualidade de Código | 7.5 | **9.0** |
| 6 | Testes | 7.5 | **9.0** |
| 7 | Performance | 6.5 | **8.5** |
| 8 | Tratamento de Erros & Logging | 8.5 | **9.5** |
| 9 | Frontend Architecture | 7.5 | **9.0** |
| 10 | Observabilidade & Monitoring | 7.0 | **9.0** |
| 11 | DevOps & CI/CD | 7.5 | **9.0** |
| 12 | Escalabilidade | 6.0 | **8.0** |
| 13 | Resiliência & Fault Tolerance | 7.5 | **9.0** |
| 14 | Documentação | 7.0 | **9.0** |
| 15 | Acessibilidade (a11y) | 5.0 | **8.0** |
| 16 | Integridade de Dados | 7.5 | **9.0** |
| 17 | Developer Experience | 8.0 | **9.0** |
| 18 | Maturidade de Produção | 7.0 | **9.0** |
| | **Média Ponderada** | **7.3** | **9.0** |

---

## Prioridade de Execução

Se o tempo for limitado, a **Fase 1 sozinha** já eleva a nota geral de 7.3 → 8.1 com apenas ~15h de trabalho. As fases 2 e 3 são o melhor custo-benefício seguinte.

As dimensões mais difíceis de elevar são:
- **Escalabilidade (6→8)**: Requer investimento em infraestrutura (custo)
- **Acessibilidade (5→8)**: Requer audit extensivo de TODOS os componentes
- **Performance (6.5→8.5)**: Requer profiling e otimização caso a caso

As mais fáceis:
- **DX (8→9)**: Commitlint + Storybook
- **Erros (8.5→9.5)**: Error codes + correlation ID
- **Segurança (8→9.5)**: Já tem 90% da infraestrutura, faltam refinamentos
