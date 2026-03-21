# ADR 027: Domain Event Bus Extension with EventLog Persistence

## Status
Accepted (2026-03-21)

## Context

The existing `DomainEventBus` was a simple in-process pub/sub with fire-and-forget semantics. Handlers were anonymous functions registered via `on()`, with no retry logic, no persistence, and no way to trace event chains across modules.

The Sales/CRM module requires reliable cross-module communication (e.g., order confirmed → stock reserved + finance entry created). Events must be traceable, retryable, and auditable.

## Decision

### 1. Extend DomainEventBus (backward-compatible)

The existing `on()`/`emit()` API is preserved. New capabilities are additive:

- **`EnhancedDomainEvent<T>`** — extends `DomainEvent` with optional fields: `eventId`, `version`, `source`, `sourceEntityType`, `sourceEntityId`, `correlationId`, `causationId`
- **`register(consumer)`** — named consumer registration with `consumerId`, `moduleId`, `subscribesTo[]`, `handle()`, and optional `retryStrategy`
- **Retry with exponential backoff** — `baseDelay * 2^attempt + jitter`, capped at `maxDelay`. Default: 3 retries
- **Dead letter** — after max retries, consumer failure is logged with error details
- **`enablePersistence()`/`disablePersistence()`** — toggle EventLog writing (lazy Prisma import for test safety)

### 2. EventLog table (PostgreSQL)

```prisma
model EventLog {
  id, tenantId, type, version, source, sourceEntityType, sourceEntityId,
  data (Json), metadata (Json?), correlationId, causationId,
  status (PUBLISHED|PROCESSING|PROCESSED|FAILED|DEAD_LETTER),
  processedBy (String[]), failedConsumers (Json?),
  retryCount, maxRetries, nextRetryAt, processedAt, createdAt
}
```

7 indexes for query performance: tenant, type, status, correlationId, sourceEntity, retry scheduling.

### 3. Initial Sales events registered

- `sales.customer.created`, `sales.customer.updated`
- `sales.deal.created`, `sales.deal.stage-changed`, `sales.deal.won`, `sales.deal.lost`

### 4. Phase 1 only — no NATS, no admin dashboard

The bus remains in-process. NATS migration (Phase 2) is transparent — same interface, different transport.

## Consequences

### Positive
- Events are persisted for audit and debugging
- Failed handlers are retried automatically with backoff
- Correlation/causation IDs enable distributed tracing
- Named consumers make monitoring possible
- Backward compatible — existing `on()` handlers continue working
- 27 unit tests cover all new functionality

### Negative
- EventLog writes add latency (mitigated: fire-and-forget, `.catch()` for failures)
- Dead letter events require manual admin intervention (no auto-replay yet)
- In-process only — can't cross process boundaries until NATS Phase 2

### Files Changed
- `prisma/schema.prisma` — added `EventLogStatus` enum + `EventLog` model + `Tenant.eventLogs` relation
- `prisma/migrations/20260321200000_add_event_log/` — SQL migration
- `src/lib/domain-events.ts` — extended with EnhancedDomainEvent, register(), retry, persistence
- `src/lib/domain-events.spec.ts` — 27 tests (6 legacy + 21 new)
- `src/lib/domain-event-subscribers.ts` — added `enablePersistence()` call
- `src/server.ts` — registered subscribers at startup
