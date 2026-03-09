# ADR-004: Prisma Repository Pattern

## Status: Accepted
## Date: 2025-07-01

## Context

We needed a data access layer that:
- Supports Clean Architecture (use cases don't know about Prisma)
- Allows unit testing with in-memory implementations
- Handles the impedance mismatch between Prisma models and domain entities
- Supports multi-tenant filtering consistently

## Decision

Each entity has:
1. **Repository interface** (`src/repositories/{module}/{entity}-repository.ts`) — defines CRUD operations
2. **Prisma implementation** (`src/repositories/{module}/prisma/prisma-{entity}-repository.ts`) — real database access
3. **In-memory implementation** (`src/repositories/{module}/in-memory/in-memory-{entity}-repository.ts`) — array-based for tests
4. **Mapper** (`src/mappers/{module}/{entity}/`) — converts between Prisma records and domain entities

Prisma repositories map domain Value Objects (e.g., `UniqueEntityID`, `Token`, `IpAddress`) to/from primitive types. All list queries include `tenantId` filtering.

Factory functions (`make-*-use-case.ts`) wire up Prisma implementations for production.

## Consequences

**Positive:**
- Unit tests run in ~170ms without database
- Consistent data access patterns across 50+ repositories
- Multi-tenant filtering is never forgotten (enforced by interface)
- Domain entities are pure — no Prisma decorators or dependencies

**Negative:**
- Two implementations per repository (Prisma + in-memory)
- Mapper boilerplate for each entity (~30-50 lines per mapper)
- In-memory implementations can drift from Prisma behavior (e.g., missing unique constraints)
- Adding a field requires touching 5+ files (schema → entity → mapper → repo interface → both implementations)
