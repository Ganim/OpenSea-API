# ADR-010: Sentry for Error Monitoring

## Status: Accepted
## Date: 2025-10-01

## Context

We needed centralized error monitoring that provides:
- Real-time alerting on new or recurring errors
- Error grouping and deduplication
- Performance monitoring (transaction traces)
- Context enrichment (user, tenant, request data)

Options considered: self-hosted ELK stack, Datadog, Sentry, Grafana Loki.

## Decision

Use **Sentry** (cloud-hosted) for both backend and frontend error monitoring.

Backend integration:
- `@sentry/node` initialized at startup (`src/lib/sentry.ts`)
- Global error handler (`src/@errors/error-handler.ts`) reports unhandled errors
- Custom helpers: `captureException()`, `captureMessage()`, `setUser()`
- Performance: 10% trace sampling in production, 100% in development
- DLQ (Dead Letter Queue) failures reported as warnings

Frontend integration:
- `@sentry/nextjs` with automatic route instrumentation
- Error boundaries report component crashes

Configuration:
- DSN provided via `SENTRY_DSN` environment variable (optional — gracefully disabled if not set)
- User context set on authentication
- Tenant context set on tenant selection

## Consequences

**Positive:**
- Zero-config error grouping and deduplication
- Stack traces with source maps (frontend) and original TypeScript lines (backend)
- Release tracking tied to Git commits
- Free tier sufficient for current scale

**Negative:**
- Third-party dependency for critical monitoring
- Performance overhead from trace sampling (mitigated by 10% rate in production)
- Sentry outage = blind to errors (mitigated by local logging via Pino)
- Data sent to external service (acceptable given no PII in error payloads)
