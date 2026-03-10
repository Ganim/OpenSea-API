# ADR-001: Clean Architecture

## Status: Accepted
## Date: 2025-06-01 (updated 2026-03-10)

## Context

The OpenSea platform needed a backend architecture that supports:
- Multiple domain modules (Core, Stock, HR, Sales, Finance, Calendar, Email, Storage, RBAC, Audit, Tasks, Requests, Notifications, Admin) that evolve independently
- Testability without requiring a running database
- Clear separation between business logic and infrastructure concerns
- Easy swapping of infrastructure components (e.g., database, email provider)

## Decision

Adopt Clean Architecture with four layers:

1. **HTTP Layer** — Fastify controllers, Zod validation, route middleware
2. **Application Layer** — Use cases encapsulating business rules
3. **Domain Layer** — Entities, Value Objects, domain errors
4. **Infrastructure Layer** — Prisma repositories, Redis, external services

Dependencies flow inward: HTTP → Application → Domain ← Infrastructure.

Repositories are defined as interfaces in the domain layer and implemented in infrastructure. Use cases depend only on interfaces, never on Prisma directly.

Cross-cutting concerns:
- **TransactionManager** (`src/lib/transaction-manager.ts`) — repositories accept optional `tx?: TransactionClient` for atomic operations across multiple repositories
- **Domain Events** — event bus for decoupled cross-module communication (e.g., CalendarSyncService reacts to HR absences, Finance entries, Stock POs)
- **Error Codes** (`src/@errors/error-codes.ts`) — machine-readable error codes in all API responses

## Consequences

**Positive:**
- Unit tests run with in-memory repositories (569+ unit tests across 14 modules)
- E2E tests run against real DB with isolated schemas (285+ E2E tests)
- Business logic is database-agnostic
- Adding a new module follows a predictable file structure
- Use cases are self-documenting (request/response interfaces)

**Negative:**
- More files per feature (entity + use case + factory + controller + mapper + repository interface + 2 implementations)
- Developers need to understand the layering rules
- Mapper boilerplate between Prisma models and domain entities
