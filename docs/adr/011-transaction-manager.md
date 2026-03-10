# ADR-011: Transaction Manager Pattern

## Status: Accepted

## Date: 2026-03-01

## Context

Several business operations require multiple database writes that must succeed or fail together as an atomic unit. Without explicit transaction management:

- Creating a finance entry with installments could partially succeed, leaving orphaned installment records with no parent entry.
- Creating a loan with its amortization schedule could create the loan header without the installment rows on failure.
- Any multi-step write relying on sequential repository calls would be vulnerable to partial persistence if an error occurs mid-way.

The existing repository pattern provides clean data-access abstraction, but each repository method executes its own independent Prisma query. There was no mechanism for use cases to coordinate multiple repository calls within a single database transaction without breaking the domain layer's independence from Prisma.

A naive approach — passing the `PrismaClient` directly into use cases — would tightly couple application logic to the infrastructure layer, violating the Clean Architecture dependency rule.

## Decision

A `TransactionManager` abstraction was introduced at `src/lib/transaction-manager.ts`.

### Core Types

```typescript
// Prisma transaction client (same API as PrismaClient, runs inside a transaction)
export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Interface for use cases — no Prisma import required
export interface TransactionManager {
  run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
}

// Prisma implementation with 30-second timeout
export class PrismaTransactionManager implements TransactionManager {
  async run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(
      (tx) => fn(tx as unknown as TransactionClient),
      { timeout: 30_000 },
    );
  }
}
```

### Repository Integration

Repositories that participate in transactions accept an optional `tx` parameter on their write methods:

```typescript
// Example: FinanceEntriesRepository interface
interface FinanceEntriesRepository {
  create(data: CreateFinanceEntrySchema, tx?: TransactionClient): Promise<FinanceEntry>;
}

// Prisma implementation
async create(data: CreateFinanceEntrySchema, tx?: TransactionClient): Promise<FinanceEntry> {
  const client = tx ?? prisma;
  return client.financeEntry.create({ data: { ... } });
}
```

### Use Case Integration

Use cases receive `TransactionManager` via constructor injection and call `run()` to wrap multi-step writes:

```typescript
// Example: CreateFinanceEntryUseCase
constructor(
  private readonly financeEntriesRepo: FinanceEntriesRepository,
  private readonly installmentsRepo: LoanInstallmentsRepository,
  private readonly transactionManager: TransactionManager,
) {}

async execute(request: Request): Promise<Response> {
  return this.transactionManager.run(async (tx) => {
    const entry = await this.financeEntriesRepo.create(data, tx);
    for (const installment of installments) {
      await this.installmentsRepo.create({ ...installment, entryId: entry.id }, tx);
    }
    return { entry };
  });
}
```

### Factory Pattern

Factories inject `PrismaTransactionManager` when instantiating use cases:

```typescript
// src/use-cases/finance/.../factories/make-create-finance-entry.ts
export function makeCreateFinanceEntry() {
  return new CreateFinanceEntryUseCase(
    new PrismaFinanceEntriesRepository(),
    new PrismaLoanInstallmentsRepository(),
    new PrismaTransactionManager(),
  );
}
```

### Applied Locations

The pattern has been applied to:

- `src/use-cases/finance/entries/` — `CreateFinanceEntryUseCase` (entry + installments)
- `src/use-cases/finance/loans/` — `CreateLoanUseCase` (loan header + amortization installments)
- Repositories with `tx?` support: `src/repositories/finance/prisma/prisma-finance-entries-repository.ts`, `prisma-loan-installments-repository.ts`, `prisma-finance-entry-cost-centers-repository.ts`, `prisma-contracts-repository.ts`

### In-Memory Repositories

In-memory implementations ignore the `tx` parameter since they operate in-process. This maintains test compatibility without requiring any mocking:

```typescript
async create(data: CreateFinanceEntrySchema, _tx?: TransactionClient): Promise<FinanceEntry> {
  // _tx ignored — in-memory is always "transactional" by nature
}
```

## Consequences

**Positive:**

- Domain and application layers have zero direct dependency on Prisma transactions. `TransactionManager` is a plain TypeScript interface.
- In-memory repositories used in unit tests require no changes to accept `tx` parameters.
- The 30-second timeout on `PrismaTransactionManager` prevents long-running transactions from holding database locks indefinitely.
- Use cases explicitly declare their transaction dependency via constructor injection, making it auditable at a glance.
- The pattern is additive — repositories without `tx?` support continue to work; only those involved in multi-step writes need to be updated.

**Negative:**

- All repositories involved in a transaction must accept and forward the `tx` parameter. Adding a new step to an existing transactional use case requires updating the participating repository interface and both implementations (Prisma + in-memory).
- The 30-second timeout is a hard global default. Use cases with legitimately longer write operations (e.g., bulk import) must handle this at a higher level or configure their own transaction.
- As of 2026-03-01, only 8 of the 12 identified critical use cases have been migrated to this pattern. Remaining candidates (bulk item movements, inventory cycle closes) are noted in the system improvement plan.
