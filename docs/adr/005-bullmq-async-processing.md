# ADR-005: BullMQ for Async Processing

## Status: Accepted
## Date: 2025-11-01

## Context

Several operations needed to run asynchronously:
- Email sending (SMTP is slow and unreliable)
- IMAP email sync (can take 30s+ per account)
- Notification delivery
- Audit log recording (shouldn't block request response)

We evaluated: direct async/await with fire-and-forget, node-cron, BullMQ, and Temporal.

## Decision

Use **BullMQ** (backed by Redis) for all async job processing.

Configuration:
- 5 queues: `notifications`, `emails`, `email-sync`, `audit-logs`, `reports` + `dead-letter` for failed jobs
- 3 attempts with exponential backoff (5s base)
- Lazy initialization (queues created on first use, not at startup)
- Separate worker process in production (`Dockerfile.worker`)
- Inline workers in development (`DISABLE_INLINE_WORKERS=true` to opt-out)
- Dead letter queue with Sentry alerting for permanently failed jobs

Schedulers run at fixed intervals:
- Email sync: 5 minutes
- Notifications: configurable via `NOTIFICATIONS_CRON_INTERVAL_MS`
- Calendar reminders: 60 seconds

## Consequences

**Positive:**
- Email sending doesn't block HTTP responses
- Failed jobs retry automatically with backoff
- Rate limiting per queue prevents overwhelming external services
- Job state is persisted in Redis (survives restarts)
- DLQ catches permanently failed jobs for investigation

**Negative:**
- Redis dependency (single point of failure, mitigated by fail-open design)
- Worker process adds deployment complexity
- Queue monitoring requires BullMQ-specific tooling (Bull Board or custom)
- Lazy initialization means first job has queue creation overhead
