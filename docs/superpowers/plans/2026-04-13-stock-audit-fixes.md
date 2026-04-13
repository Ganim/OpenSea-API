# Stock Module Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 57 issues found in the Stock module audit + remove Supplier from Stock (moved to Finance)

**Architecture:** Fixes are grouped into 10 phases ordered by dependency and risk. Phase 1 removes Supplier (structural), Phase 2-3 fix security, Phase 4 adds DB constraints, Phase 5-7 fix performance, Phase 8 fixes business logic, Phase 9 fixes frontend, Phase 10 removes dead code.

**Tech Stack:** TypeScript, Fastify, Prisma, PostgreSQL, Next.js 16, React 19, TailwindCSS 4

**IMPORTANT RULES:**
- All commits go directly to `main` branch (no feature branches)
- Never push without explicit user order
- All user-facing text in Portuguese with correct accents
- Destructive actions always use VerifyActionPinModal
- Never use `onRequest` for auth middleware — always `preHandler`

---

## Phase 1: Remove Supplier from Stock Module

Supplier entity belongs to Finance, not Stock. Remove all supplier code from stock module in API, APP, and clean up cross-references.

### Task 1.1: Remove Supplier Route Registration

**Files:**
- Modify: `OpenSea-API/src/http/routes.ts` (lines 124, 344)

- [ ] **Step 1: Remove supplier import and registration from routes.ts**

In `OpenSea-API/src/http/routes.ts`, remove line 124:
```typescript
import { suppliersRoutes } from './controllers/stock/suppliers/routes';
```

And remove line 344:
```typescript
  await app.register(suppliersRoutes);
```

- [ ] **Step 2: Verify API still starts**

Run: `cd OpenSea-API && npm run dev`
Expected: Server starts without errors on port 3333. No "suppliersRoutes" reference errors.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add src/http/routes.ts && git commit -m "refactor(stock): remove supplier routes registration from stock module"
```

### Task 1.2: Delete Supplier Controllers, Use Cases, Repos, Entities, Schemas, Mappers, Factories, Tests

**Files to DELETE (entire directories/files):**

**Controllers + E2E tests:**
- Delete: `OpenSea-API/src/http/controllers/stock/suppliers/` (entire directory — routes.ts, 5 controllers, 5 e2e specs)

**Schemas:**
- Delete: `OpenSea-API/src/http/schemas/stock/suppliers/` (entire directory)

**Use cases + unit tests + factories:**
- Delete: `OpenSea-API/src/use-cases/stock/suppliers/` (entire directory — 5 use cases, 5 specs, 5 factories)

**Repositories:**
- Delete: `OpenSea-API/src/repositories/stock/prisma/prisma-suppliers-repository.ts`
- Delete: `OpenSea-API/src/repositories/stock/in-memory/in-memory-suppliers-repository.ts`
- Delete: `OpenSea-API/src/repositories/stock/suppliers-repository.ts`

**Entity:**
- Delete: `OpenSea-API/src/entities/stock/supplier.ts`

**Mappers:**
- Delete: `OpenSea-API/src/mappers/stock/supplier/` (entire directory)

**Test factory:**
- Delete: `OpenSea-API/src/utils/tests/factories/stock/create-supplier.e2e.ts`

- [ ] **Step 1: Delete all supplier directories and files**

```bash
cd OpenSea-API
rm -rf src/http/controllers/stock/suppliers/
rm -rf src/http/schemas/stock/suppliers/
rm -rf src/use-cases/stock/suppliers/
rm -rf src/mappers/stock/supplier/
rm -f src/repositories/stock/prisma/prisma-suppliers-repository.ts
rm -f src/repositories/stock/in-memory/in-memory-suppliers-repository.ts
rm -f src/repositories/stock/suppliers-repository.ts
rm -f src/entities/stock/supplier.ts
rm -f src/utils/tests/factories/stock/create-supplier.e2e.ts
```

- [ ] **Step 2: Remove supplier export from stock schemas index**

In `OpenSea-API/src/http/schemas/stock/index.ts`, remove the line that exports suppliers.

- [ ] **Step 3: Remove supplier from stock audit messages**

In `OpenSea-API/src/constants/audit-messages/stock.messages.ts`, remove all supplier-related audit message constants.

- [ ] **Step 4: Remove supplier from stock permission codes**

In `OpenSea-API/src/constants/rbac/permission-codes.ts`, remove `SUPPLIERS` entries from the `STOCK` permission namespace. (Keep any supplier permissions that belong to Finance.)

- [ ] **Step 5: Grep for remaining "supplier" references in stock module**

```bash
cd OpenSea-API && grep -ri "supplier" src/modules/stock/ src/http/controllers/stock/ src/use-cases/stock/ src/repositories/stock/ src/entities/stock/ src/mappers/stock/ src/http/schemas/stock/ --include="*.ts" -l
```

Fix any remaining references found.

- [ ] **Step 6: Verify build compiles**

Run: `cd OpenSea-API && npx tsc --noEmit`
Expected: No TypeScript errors related to missing supplier imports.

- [ ] **Step 7: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "refactor(stock): remove all supplier code from stock module (moved to finance)"
```

### Task 1.3: Remove Supplier References from Frontend Stock Module

**Files to modify/delete in OpenSea-APP:**

- Delete: `OpenSea-APP/src/types/stock/supplier.types.ts`
- Modify: `OpenSea-APP/src/types/stock/index.ts` (remove supplier export)
- Delete: `OpenSea-APP/src/app/(dashboard)/(actions)/import/stock/suppliers/page.tsx`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/page.tsx` (remove suppliers count from overview)
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/_shared/constants/stock-permissions.ts` (remove supplier permissions)
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/page.tsx` (remove supplier import link)
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/stock/products/page.tsx` (remove suppliers dropdown)
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/config/entity-definitions.ts` (remove supplier config)
- Modify: `OpenSea-APP/src/app/(dashboard)/(actions)/import/_shared/hooks/use-reference-data.ts` (remove fetchSuppliers)

- [ ] **Step 1: Delete supplier type file and update barrel**

```bash
cd OpenSea-APP
rm -f src/types/stock/supplier.types.ts
```
Then in `src/types/stock/index.ts`, remove the `export * from './supplier.types'` line.

- [ ] **Step 2: Delete supplier import page**

```bash
rm -rf "src/app/(dashboard)/(actions)/import/stock/suppliers/"
```

- [ ] **Step 3: Remove supplier count from stock overview page**

In `src/app/(dashboard)/(modules)/stock/page.tsx`, find and remove the card/counter that shows supplier count.

- [ ] **Step 4: Remove supplier permissions from stock constants**

In `src/app/(dashboard)/(modules)/stock/_shared/constants/stock-permissions.ts`, remove supplier-related permission constants.

- [ ] **Step 5: Clean up import system references**

In the import-related files, remove supplier entity definitions, dropdown options, and fetchSuppliers hooks.

- [ ] **Step 6: Remove supplier references from purchase orders pages**

In the purchase order pages that reference supplier (new, list, detail), replace supplier references with the Finance module's supplier data or remove supplier filter if it was stock-only.

- [ ] **Step 7: Grep for remaining supplier references**

```bash
cd OpenSea-APP && grep -ri "supplier" src/app/\(dashboard\)/\(modules\)/stock/ src/types/stock/ --include="*.tsx" --include="*.ts" -l
```

Fix any remaining references.

- [ ] **Step 8: Verify build**

Run: `cd OpenSea-APP && npm run build`
Expected: Build succeeds with no supplier-related errors.

- [ ] **Step 9: Commit**

```bash
cd OpenSea-APP && git add -A && git commit -m "refactor(stock): remove all supplier references from stock frontend (moved to finance)"
```

---

## Phase 2: Security — Missing Middleware (CRITICAL)

### Task 2.1: Add verifyTenant to Address Controllers

**Files:**
- Modify: `OpenSea-API/src/http/controllers/stock/address/v1-parse-address.controller.ts` (line 14-20)
- Modify: `OpenSea-API/src/http/controllers/stock/address/v1-validate-address.controller.ts` (line 14-20)

- [ ] **Step 1: Add verifyTenant import and middleware to parse-address**

In `v1-parse-address.controller.ts`, add import:
```typescript
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
```

Change preHandler from:
```typescript
preHandler: [
  verifyJwt,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.STOCK.WAREHOUSES.ACCESS,
    resource: 'address',
  }),
],
```
To:
```typescript
preHandler: [
  verifyJwt,
  verifyTenant,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.STOCK.WAREHOUSES.ACCESS,
    resource: 'address',
  }),
],
```

- [ ] **Step 2: Same fix for validate-address**

Apply identical change to `v1-validate-address.controller.ts`.

- [ ] **Step 3: Verify API starts**

Run: `cd OpenSea-API && npm run dev`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/address/ && git commit -m "fix(security): add verifyTenant middleware to address controllers"
```

### Task 2.2: Add Permission Middleware to Lookup Controller

**Files:**
- Modify: `OpenSea-API/src/http/controllers/stock/lookup/v1-lookup-by-code.controller.ts` (line 13)

- [ ] **Step 1: Add createPermissionMiddleware**

Add imports:
```typescript
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
```

Change preHandler from:
```typescript
preHandler: [verifyJwt, verifyTenant],
```
To:
```typescript
preHandler: [
  verifyJwt,
  verifyTenant,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.STOCK.ITEMS.ACCESS,
    resource: 'lookup',
  }),
],
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add src/http/controllers/stock/lookup/ && git commit -m "fix(security): add permission middleware to stock lookup controller"
```

---

## Phase 3: Database Constraints & Indexes

### Task 3.1: Add Missing Composite Indexes to Item Model

**Files:**
- Modify: `OpenSea-API/prisma/schema.prisma` (lines 2432-2450, Item model indexes)

- [ ] **Step 1: Add composite indexes**

In the Item model's index section (after existing `@@index` entries, before `@@map("items")`), add:

```prisma
  @@index([tenantId, barcode])
  @@index([tenantId, eanCode])
  @@index([tenantId, upcCode])
  @@index([tenantId, binId])
  @@index([tenantId, expiryDate])
  @@index([tenantId, createdAt])
  @@index([tenantId, updatedAt])
  @@index([currentQuantity])
```

- [ ] **Step 2: Generate Prisma client**

Run: `cd OpenSea-API && npx prisma generate`
Expected: Prisma client regenerated successfully.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add prisma/schema.prisma && git commit -m "perf(stock): add composite indexes for Item model queries"
```

### Task 3.2: Add SKU Unique Constraint for Variants

**Files:**
- Modify: `OpenSea-API/prisma/schema.prisma` (Variant model)

- [ ] **Step 1: Find Variant model and add unique constraint**

In the Variant model, add a conditional unique index:
```prisma
  @@unique([sku, tenantId, deletedAt], name: "variants_sku_unique_active")
```

- [ ] **Step 2: Generate Prisma client**

Run: `cd OpenSea-API && npx prisma generate`

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add prisma/schema.prisma && git commit -m "fix(stock): add SKU unique constraint per tenant on Variant model"
```

---

## Phase 4: Race Condition Fix — Atomic Stock Operations

### Task 4.1: Fix Race Condition in register-item-exit

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/items/register-item-exit.ts` (lines 80-124)

- [ ] **Step 1: Refactor to use atomic decrement inside transaction**

The current code reads `item.currentQuantity`, validates, then saves in a transaction. The fix is to move the quantity check and update INSIDE the transaction using Prisma's atomic `decrement`:

Replace the current pattern (lines 80-124) to:
1. Fetch item (for existence check only, outside transaction)
2. Inside `transactionManager.run()`:
   a. Use `prisma.item.update({ where: { id, tenantId }, data: { currentQuantity: { decrement: quantity } } })` for atomic update
   b. Check if `updatedItem.currentQuantity < 0` — if so, throw error (transaction rolls back)
   c. If `currentQuantity === 0`, update status to EXPIRED
   d. Create movement record

```typescript
const { savedItem, movement } = await this.transactionManager.run(
  async (tx) => {
    // Atomic decrement — prevents race condition
    const updatedItem = await this.itemsRepository.atomicDecrement(
      item.id,
      input.quantity,
      input.tenantId,
      tx,
    );

    if (updatedItem.currentQuantity < 0) {
      throw new BadRequestError(
        `Quantidade insuficiente. Atual: ${updatedItem.currentQuantity + input.quantity}, Solicitado: ${input.quantity}`,
      );
    }

    // If depleted, mark as expired
    if (updatedItem.currentQuantity === 0) {
      updatedItem.status = ItemStatus.create('EXPIRED');
      updatedItem.exitMovementType = input.movementType;
      await this.itemsRepository.save(updatedItem, tx);
    }

    const mov = await this.itemMovementsRepository.create({
      tenantId: input.tenantId,
      itemId: item.id,
      userId: new UniqueEntityID(input.userId),
      quantity: input.quantity,
      quantityBefore: updatedItem.currentQuantity + input.quantity,
      quantityAfter: updatedItem.currentQuantity,
      movementType: MovementType.create(input.movementType),
      reasonCode: input.reasonCode,
      destinationRef: input.destinationRef,
      notes: input.notes,
    }, tx);

    return { savedItem: updatedItem, movement: mov };
  },
);
```

- [ ] **Step 2: Add atomicDecrement to ItemsRepository interface**

In `OpenSea-API/src/repositories/stock/items-repository.ts`, add:
```typescript
atomicDecrement(
  id: UniqueEntityID,
  quantity: number,
  tenantId: string,
  tx?: TransactionClient,
): Promise<Item>;
```

- [ ] **Step 3: Implement atomicDecrement in Prisma repository**

In `OpenSea-API/src/repositories/stock/prisma/prisma-items-repository.ts`, add:
```typescript
async atomicDecrement(
  id: UniqueEntityID,
  quantity: number,
  tenantId: string,
  tx?: TransactionClient,
): Promise<Item> {
  const prisma = tx ?? this.prisma;
  const updated = await prisma.item.update({
    where: { id: id.toString(), tenantId },
    data: { currentQuantity: { decrement: quantity } },
  });
  return ItemPrismaToDomain.toDomain(updated);
}
```

- [ ] **Step 4: Implement in in-memory repository**

In `OpenSea-API/src/repositories/stock/in-memory/in-memory-items-repository.ts`, add basic implementation that mirrors the behavior.

- [ ] **Step 5: Run unit tests**

Run: `cd OpenSea-API && npx vitest run src/use-cases/stock/items/register-item-exit.spec.ts`

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "fix(stock): atomic decrement for item exit to prevent race conditions"
```

---

## Phase 5: Performance — N+1 Queries

### Task 5.1: Fix In-Memory Pagination for binId and batchNumber

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/items/list-items.ts` (lines 84-109)
- Modify: `OpenSea-API/src/repositories/stock/items-repository.ts` (add paginated methods)
- Modify: `OpenSea-API/src/repositories/stock/prisma/prisma-items-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/in-memory/in-memory-items-repository.ts`

- [ ] **Step 1: Add paginated repository methods**

Add to `items-repository.ts`:
```typescript
findManyByBinPaginated(
  binId: UniqueEntityID,
  tenantId: string,
  page: number,
  limit: number,
): Promise<{ data: ItemWithRelationsDTO[]; total: number }>;

findManyByBatchPaginated(
  batchNumber: string,
  tenantId: string,
  page: number,
  limit: number,
): Promise<{ data: ItemWithRelationsDTO[]; total: number }>;
```

- [ ] **Step 2: Implement in Prisma repository**

Use `findMany` with `skip` and `take` + `count()` for total.

- [ ] **Step 3: Implement in in-memory repository**

Use array slicing for pagination.

- [ ] **Step 4: Update list-items use case**

Replace in-memory pagination (lines 84-109) with:
```typescript
if (input.binId) {
  const result = await this.itemsRepository.findManyByBinPaginated(
    new UniqueEntityID(input.binId),
    tenantId,
    page,
    limit,
  );
  return this.buildResponse(result.data, result.total, page, limit, Math.ceil(result.total / limit));
}

if (input.batchNumber) {
  const result = await this.itemsRepository.findManyByBatchPaginated(
    input.batchNumber,
    tenantId,
    page,
    limit,
  );
  return this.buildResponse(result.data, result.total, page, limit, Math.ceil(result.total / limit));
}
```

- [ ] **Step 5: Run tests**

Run: `cd OpenSea-API && npx vitest run src/use-cases/stock/items/list-items.spec.ts`

- [ ] **Step 6: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "perf(stock): replace in-memory pagination with DB-level for binId/batchNumber filters"
```

### Task 5.2: Fix N+1 in scan-inventory-item

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/inventory/scan-inventory-item.ts` (lines 127-148)
- Modify: `OpenSea-API/src/repositories/stock/items-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/prisma/prisma-items-repository.ts`
- Modify: `OpenSea-API/src/repositories/stock/in-memory/in-memory-items-repository.ts`

- [ ] **Step 1: Add findByAnyCode method to repository**

```typescript
findByAnyCode(code: string, tenantId: string): Promise<Item | null>;
```

Prisma implementation uses single query with OR:
```typescript
const item = await this.prisma.item.findFirst({
  where: {
    tenantId,
    deletedAt: null,
    OR: [
      { fullCode: code },
      { barcode: code },
      { eanCode: code },
      { upcCode: code },
      { uniqueCode: code },
    ],
  },
});
```

- [ ] **Step 2: Replace sequential lookups in scan-inventory-item**

Replace the 5 sequential `findBy*` calls with single `findByAnyCode()`.

- [ ] **Step 3: Run tests and commit**

```bash
cd OpenSea-API && git add -A && git commit -m "perf(stock): consolidate 5 barcode lookups into single findByAnyCode query"
```

### Task 5.3: Fix Serial Operations in batch-transfer-items

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/items/batch-transfer-items.ts` (lines 112-145)

- [ ] **Step 1: Batch the item updates and movement inserts**

Replace the serial `for` loop with collected arrays + batch operations:

```typescript
// Collect all updates
const itemUpdates: Array<{ id: UniqueEntityID; binId: UniqueEntityID; address: string }> = [];
const movementInputs: Array<CreateMovementInput> = [];

for (const itemId of input.itemIds) {
  const item = itemsMap.get(itemId)!;
  if (item.binId && item.binId.equals(destinationBin.binId)) continue;
  
  const originAddress = item.binId
    ? originBinsMap.get(item.binId.toString())?.address
    : undefined;

  itemUpdates.push({
    id: item.id,
    binId: destinationBin.binId,
    address: destinationBin.address,
  });

  movementInputs.push({
    tenantId: input.tenantId,
    itemId: item.id,
    userId: new UniqueEntityID(input.userId),
    quantity: item.currentQuantity,
    quantityBefore: item.currentQuantity,
    quantityAfter: item.currentQuantity,
    movementType: MovementType.create('TRANSFER'),
    originRef: originAddress ?? undefined,
    destinationRef: destinationBin.address,
    notes: input.notes || 'Batch transfer',
  });
}

// Batch execute
await this.itemsRepository.updateManyBins(itemUpdates);
const movements = await this.itemMovementsRepository.createMany(movementInputs);
```

- [ ] **Step 2: Add batch repository methods if they don't exist**

Add `updateManyBins` and `createMany` to respective repositories.

- [ ] **Step 3: Run tests and commit**

```bash
cd OpenSea-API && git add -A && git commit -m "perf(stock): batch transfer items using bulk update instead of serial saves"
```

---

## Phase 6: Business Logic Fixes

### Task 6.1: Add Item Check to Warehouse Deletion

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/warehouses/delete-warehouse.ts` (lines 34-41)

- [ ] **Step 1: Add item count check after zone check**

After the existing zone check (line 37-41), add:
```typescript
// Check if warehouse has any items (even if zones were deleted, items could remain)
const itemCount = await this.itemsRepository.countByWarehouseId(warehouseId, tenantId);
if (itemCount > 0) {
  throw new BadRequestError(
    `Não é possível excluir o armazém com ${itemCount} item(ns). Remova ou transfira os itens primeiro.`,
  );
}
```

- [ ] **Step 2: Add countByWarehouseId to ItemsRepository**

Add interface method and implement in Prisma (query items through bins→zones→warehouse chain).

- [ ] **Step 3: Inject ItemsRepository into DeleteWarehouseUseCase**

Update constructor and factory.

- [ ] **Step 4: Update unit tests**

- [ ] **Step 5: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "fix(stock): check for items before warehouse deletion"
```

### Task 6.2: Add Item Check to Product Deletion

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/products/delete-product.ts` (lines 32-44)

- [ ] **Step 1: Add item existence check before variant cascade delete**

Before soft-deleting variants, check if any variant has active items:
```typescript
for (const variant of variants) {
  const itemCount = await this.itemsRepository.countByVariantId(variant.id, tenantId);
  if (itemCount > 0) {
    throw new BadRequestError(
      `Não é possível excluir o produto. A variante "${variant.name}" possui ${itemCount} item(ns) em estoque.`,
    );
  }
}
```

- [ ] **Step 2: Add countByVariantId if missing, inject repo, update factory**

- [ ] **Step 3: Update unit tests**

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "fix(stock): prevent product deletion when variants have active items"
```

---

## Phase 7: Frontend Fixes

### Task 7.1: Fix Tags Delete Modal — Use VerifyActionPinModal

**Files:**
- Rewrite: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/tags/src/modals/delete-confirm-modal.tsx`

- [ ] **Step 1: Replace AlertDialog with VerifyActionPinModal**

Replace entire file content with:
```tsx
'use client';

import { VerifyActionPinModal } from '@/components/shared/verify-action-pin-modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  count: number;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  count,
}: DeleteConfirmModalProps) {
  return (
    <VerifyActionPinModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      title="Confirmar Exclusão"
      description={
        count === 1
          ? 'Digite seu PIN de ação para excluir esta tag.'
          : `Digite seu PIN de ação para excluir ${count} tags.`
      }
    />
  );
}
```

- [ ] **Step 2: Update call site to use onSuccess instead of onConfirm**

In the tags page that uses `DeleteConfirmModal`, change `onConfirm` to `onSuccess` prop.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add -A && git commit -m "fix(stock): tags delete modal now uses VerifyActionPinModal with PIN confirmation"
```

### Task 7.2: Fix "acao" Typo in Product Categories

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/product-categories/page.tsx` (line 542)

- [ ] **Step 1: Fix typo**

Change `"Digite seu PIN de acao"` to `"Digite seu PIN de ação"`.

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP && git add -A && git commit -m "fix(stock): fix accent typo in product categories delete modal"
```

### Task 7.3: Fix Manufacturers Product Count — Remove Full Fetch

**Files:**
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/stock/(entities)/manufacturers/page.tsx` (lines 137-157)

- [ ] **Step 1: Replace full product fetch with count from API**

Instead of fetching ALL products to count per manufacturer, use the manufacturer's own `productCount` field from the API response (if available), or show the count from the list endpoint's metadata. If no count endpoint exists, remove the count display or add a dedicated lightweight endpoint.

The simplest approach: check if the list-manufacturers API already returns a product count per manufacturer. If not, add `_count: { products: true }` to the Prisma include in the backend's list-manufacturers use case, then use it directly.

- [ ] **Step 2: Same fix for Templates product count**

In `templates/page.tsx` (lines 182-216), apply the same pattern.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-APP && git add -A && git commit -m "perf(stock): use API product counts instead of fetching all products"
```

---

## Phase 8: Dead Code Cleanup (API)

### Task 8.1: Remove Orphaned Use Cases

**Files to delete:**
- `OpenSea-API/src/use-cases/stock/admin/check-location-consistency.ts`
- `OpenSea-API/src/use-cases/stock/admin/factories/make-check-location-consistency-use-case.ts`

NOTE: `check-stock-alerts.ts` — keep this file since it could be useful for a future cron job. Add a TODO comment explaining it needs a controller or cron trigger.

- [ ] **Step 1: Delete orphaned files**

```bash
cd OpenSea-API
rm -f src/use-cases/stock/admin/check-location-consistency.ts
rm -f src/use-cases/stock/admin/factories/make-check-location-consistency-use-case.ts
```

- [ ] **Step 2: Add TODO to check-stock-alerts**

In `check-stock-alerts.ts`, add at the top:
```typescript
// TODO: Expose via admin endpoint or register as cron job trigger
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "chore(stock): remove orphaned check-location-consistency use case"
```

### Task 8.2: Remove Deprecated volume.mapper.ts

**Files:**
- Delete: `OpenSea-API/src/mappers/stock/volume.mapper.ts`

- [ ] **Step 1: Verify no imports reference it**

```bash
cd OpenSea-API && grep -r "volume.mapper" src/ --include="*.ts" -l
```

If no results, safe to delete.

- [ ] **Step 2: Delete and commit**

```bash
rm -f src/mappers/stock/volume.mapper.ts
git add -A && git commit -m "chore(stock): remove deprecated volume.mapper.ts"
```

### Task 8.3: Remove Unused Repository Methods

**Files:**
- Modify: `OpenSea-API/src/repositories/stock/bins-repository.ts` (remove findManyByAisle, findManyBlocked, countByZone)
- Modify: `OpenSea-API/src/repositories/stock/items-repository.ts` (remove findManyByStatus, findManyExpiring, findManyExpired, findAllWithRelations)
- Modify corresponding Prisma and in-memory implementations

- [ ] **Step 1: Remove methods from interface and implementations**

For each method: remove from interface, Prisma impl, and in-memory impl.

- [ ] **Step 2: Verify no references**

```bash
cd OpenSea-API && grep -r "findManyByAisle\|findManyBlocked\|countByZone\|findManyByStatus\|findManyExpiring\|findManyExpired\|findAllWithRelations" src/ --include="*.ts" -l
```

Only the files being edited should appear.

- [ ] **Step 3: Run tests**

```bash
cd OpenSea-API && npm run test
```

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "chore(stock): remove unused repository methods"
```

---

## Phase 9: Minor Fixes

### Task 9.1: Fix Error Messages to Portuguese

**Files:**
- Modify: `OpenSea-API/src/use-cases/stock/items/register-item-exit.ts`
- Modify: `OpenSea-API/src/use-cases/stock/warehouses/delete-warehouse.ts`

- [ ] **Step 1: Translate error messages**

In `register-item-exit.ts`:
- `"Quantity must be greater than zero."` → `"A quantidade deve ser maior que zero."`
- `"Insufficient quantity available..."` → `"Quantidade insuficiente. Atual: ${quantityBefore}, Solicitado: ${input.quantity}"`

In `delete-warehouse.ts`:
- `"Cannot delete warehouse with ${zoneCount} zone(s)..."` → `"Não é possível excluir o armazém com ${zoneCount} zona(s). Exclua todas as zonas primeiro."`

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "fix(stock): translate error messages to Portuguese"
```

### Task 9.2: Add Missing Notes Max Length Validation

**Files:**
- Modify: `OpenSea-API/src/http/schemas/stock/suppliers/supplier.schema.ts` — SKIP (file will be deleted in Phase 1)

Search for other schema files with unbounded `z.string().optional()` fields that should have max length:

```bash
cd OpenSea-API && grep -rn "z.string().optional()" src/http/schemas/stock/ --include="*.ts"
```

Add `.max(5000)` to any `notes` or `description` fields that lack it.

- [ ] **Step 1: Add max lengths to unbounded string fields**

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add -A && git commit -m "fix(stock): add max length validation to unbounded text fields"
```

---

## Phase 10: Final Verification

### Task 10.1: Full Build Verification

- [ ] **Step 1: API build**

```bash
cd OpenSea-API && npx tsc --noEmit
```

- [ ] **Step 2: API unit tests**

```bash
cd OpenSea-API && npm run test
```

- [ ] **Step 3: APP build**

```bash
cd OpenSea-APP && npm run build
```

- [ ] **Step 4: Verify no remaining supplier references in stock**

```bash
cd OpenSea-API && grep -ri "supplier" src/http/controllers/stock/ src/use-cases/stock/ src/repositories/stock/ src/entities/stock/ --include="*.ts" -l
cd OpenSea-APP && grep -ri "supplier" "src/app/(dashboard)/(modules)/stock/" --include="*.tsx" --include="*.ts" -l
```

Expected: No results.

---

## Summary

| Phase | Tasks | Commits | Focus |
|-------|-------|---------|-------|
| 1 | 3 | 3 | Remove Supplier from Stock |
| 2 | 2 | 2 | Security: Missing middleware |
| 3 | 2 | 2 | DB constraints & indexes |
| 4 | 1 | 1 | Race condition fix |
| 5 | 3 | 3 | N+1 & pagination performance |
| 6 | 2 | 2 | Business logic (cascade checks) |
| 7 | 3 | 3 | Frontend fixes |
| 8 | 3 | 3 | Dead code cleanup |
| 9 | 2 | 2 | Minor fixes (i18n, validation) |
| 10 | 1 | 0 | Final verification |
| **Total** | **22** | **21** | |
