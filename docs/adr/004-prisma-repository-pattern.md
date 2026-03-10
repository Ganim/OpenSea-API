# ADR-004: Prisma Repository Pattern

## Status: Accepted
## Date: 2025-07-01 (updated 2026-03-10)

## Context

We needed a data access layer that:
- Supports Clean Architecture (use cases don't know about Prisma)
- Allows unit testing with in-memory implementations
- Handles the impedance mismatch between Prisma models and domain entities
- Supports multi-tenant filtering consistently
- Supports atomic operations across multiple repositories (transactions)

## Decision

Each entity has:
1. **Repository interface** (`src/repositories/{module}/{entity}-repository.ts`) — defines CRUD operations
2. **Prisma implementation** (`src/repositories/{module}/prisma/prisma-{entity}-repository.ts`) — real database access
3. **In-memory implementation** (`src/repositories/{module}/in-memory/in-memory-{entity}-repository.ts`) — array-based for tests
4. **Mapper** (`src/mappers/{module}/{entity}/`) — converts between Prisma records and domain entities

Prisma repositories map domain Value Objects (e.g., `UniqueEntityID`, `Token`, `IpAddress`) to/from primitive types. All list queries include `tenantId` filtering.

Factory functions (`make-*-use-case.ts`) wire up Prisma implementations for production.

**Transaction support** (added 2026-03):
- Repositories accept optional `tx?: TransactionClient` parameter on write methods
- `TransactionManager` (`src/lib/transaction-manager.ts`) provides `PrismaTransactionManager` for coordinating multi-repository transactions
- Applied to: finance entry installments, loan creation, and 8+ other critical use cases

## Consequences

**Positive:**
- Unit tests run without database (569+ unit tests)
- Consistent data access patterns across 109+ repository interfaces
- Multi-tenant filtering is never forgotten (enforced by interface)
- Domain entities are pure — no Prisma decorators or dependencies
- Transactions are opt-in per method, not forced on all operations

**Negative:**
- Two implementations per repository (Prisma + in-memory)
- Mapper boilerplate for each entity (~30-50 lines per mapper)
- In-memory implementations can drift from Prisma behavior (e.g., missing unique constraints)
- Adding a field requires touching 5+ files (schema → entity → mapper → repo interface → both implementations)
