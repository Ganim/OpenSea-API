# Admin Companies Reorganization — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move companies domain from HR to core (shared entity) with admin as CRUD owner; HR and Finance get read-only access with their own permissions.

**Architecture:** Entities/repos/mappers move to `core/`, use cases consolidate under `admin/`, sub-resource controllers move to `admin/companies/` subdirs. HR keeps 2 read-only controllers, Finance gets 2 new read-only controllers. ~164 import paths updated.

**Tech Stack:** TypeScript, Fastify, Prisma, Clean Architecture

**Spec:** `docs/superpowers/specs/2026-03-11-admin-companies-reorganization-design.md`

---

## Chunk 1: Backend — Entity Layer Migration (hr/ → core/)

### Task 1: Move company entities to core

**Files:**
- Move: `src/entities/hr/company.ts` → `src/entities/core/company.ts`
- Move: `src/entities/hr/company-address.ts` → `src/entities/core/company-address.ts`
- Move: `src/entities/hr/company-cnae.ts` → `src/entities/core/company-cnae.ts`
- Move: `src/entities/hr/company-fiscal-settings.ts` → `src/entities/core/company-fiscal-settings.ts`
- Move: `src/entities/hr/company-stakeholder.ts` → `src/entities/core/company-stakeholder.ts`
- Modify: `src/entities/hr/index.ts` (remove company re-exports)

- [ ] **Step 1: Move entity files**

```bash
cd OpenSea-API
mv src/entities/hr/company.ts src/entities/core/company.ts
mv src/entities/hr/company-address.ts src/entities/core/company-address.ts
mv src/entities/hr/company-cnae.ts src/entities/core/company-cnae.ts
mv src/entities/hr/company-fiscal-settings.ts src/entities/core/company-fiscal-settings.ts
mv src/entities/hr/company-stakeholder.ts src/entities/core/company-stakeholder.ts
```

- [ ] **Step 2: Update `src/entities/hr/index.ts`**

Remove all company-related exports (lines 7-32). Keep only non-company exports (Absence, Bonus, etc.).

- [ ] **Step 3: Update all imports from `@/entities/hr/company*` to `@/entities/core/company*`**

Use find-and-replace across all `.ts` files. Replace patterns:
- `from '@/entities/hr/company'` → `from '@/entities/core/company'`
- `from '@/entities/hr/company-address'` → `from '@/entities/core/company-address'`
- `from '@/entities/hr/company-cnae'` → `from '@/entities/core/company-cnae'`
- `from '@/entities/hr/company-fiscal-settings'` → `from '@/entities/core/company-fiscal-settings'`
- `from '@/entities/hr/company-stakeholder'` → `from '@/entities/core/company-stakeholder'`

Also update any barrel imports: `from '@/entities/hr'` that destructure company types — these need to import from `'@/entities/core/company'` etc. instead.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to `entities/hr/company*`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move company entities from hr/ to core/"
```

### Task 2: Move company mappers to core

**Files:**
- Move: `src/mappers/hr/company/` → `src/mappers/core/company/`
- Move: `src/mappers/hr/company-address/` → `src/mappers/core/company-address/`
- Move: `src/mappers/hr/company-cnae/` → `src/mappers/core/company-cnae/`
- Move: `src/mappers/hr/company-fiscal-settings/` → `src/mappers/core/company-fiscal-settings/`
- Move: `src/mappers/hr/company-stakeholder/` → `src/mappers/core/company-stakeholder/`
- Modify: `src/mappers/hr/index.ts` (remove company re-exports)

- [ ] **Step 1: Move mapper directories**

```bash
cd OpenSea-API
mv src/mappers/hr/company src/mappers/core/company
mv src/mappers/hr/company-address src/mappers/core/company-address
mv src/mappers/hr/company-cnae src/mappers/core/company-cnae
mv src/mappers/hr/company-fiscal-settings src/mappers/core/company-fiscal-settings
mv src/mappers/hr/company-stakeholder src/mappers/core/company-stakeholder
```

- [ ] **Step 2: Update `src/mappers/hr/index.ts`**

Remove company-related re-exports (lines 3-7):
```
- export * from './company';
- export * from './company-address';
- export * from './company-cnae';
- export * from './company-fiscal-settings';
- export * from './company-stakeholder';
```

- [ ] **Step 3: Update all imports from `@/mappers/hr/company*` to `@/mappers/core/company*`**

Replace patterns across all `.ts` files:
- `from '@/mappers/hr/company/'` → `from '@/mappers/core/company/'`
- `from '@/mappers/hr/company/company-to-dto'` → `from '@/mappers/core/company/company-to-dto'`
- `from '@/mappers/hr/company/company-prisma-to-domain'` → `from '@/mappers/core/company/company-prisma-to-domain'`
- Same pattern for company-address, company-cnae, company-fiscal-settings, company-stakeholder
- Also update barrel imports: `from '@/mappers/hr'` that reference company mappers

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move company mappers from hr/ to core/"
```

### Task 3: Move company repositories to core

**Files:**
- Move: `src/repositories/hr/companies-repository.ts` → `src/repositories/core/companies-repository.ts`
- Move: `src/repositories/hr/company-addresses-repository.ts` → `src/repositories/core/company-addresses-repository.ts`
- Move: `src/repositories/hr/company-cnaes-repository.ts` → `src/repositories/core/company-cnaes-repository.ts`
- Move: `src/repositories/hr/company-fiscal-settings-repository.ts` → `src/repositories/core/company-fiscal-settings-repository.ts`
- Move: `src/repositories/hr/company-stakeholder-repository.ts` → `src/repositories/core/company-stakeholder-repository.ts`
- Move: 5 Prisma repos from `src/repositories/hr/prisma/` → `src/repositories/core/prisma/`
- Move: 5 In-memory repos from `src/repositories/hr/in-memory/` → `src/repositories/core/in-memory/`

- [ ] **Step 1: Ensure core prisma and in-memory dirs exist**

```bash
cd OpenSea-API
mkdir -p src/repositories/core/prisma src/repositories/core/in-memory
```

- [ ] **Step 2: Move all repository files (interfaces + prisma + in-memory)**

```bash
# Interfaces
mv src/repositories/hr/companies-repository.ts src/repositories/core/
mv src/repositories/hr/company-addresses-repository.ts src/repositories/core/
mv src/repositories/hr/company-cnaes-repository.ts src/repositories/core/
mv src/repositories/hr/company-fiscal-settings-repository.ts src/repositories/core/
mv src/repositories/hr/company-stakeholder-repository.ts src/repositories/core/

# Prisma
mv src/repositories/hr/prisma/prisma-companies-repository.ts src/repositories/core/prisma/
mv src/repositories/hr/prisma/prisma-company-addresses-repository.ts src/repositories/core/prisma/
mv src/repositories/hr/prisma/prisma-company-cnaes-repository.ts src/repositories/core/prisma/
mv src/repositories/hr/prisma/prisma-company-fiscal-settings-repository.ts src/repositories/core/prisma/
mv src/repositories/hr/prisma/prisma-company-stakeholder-repository.ts src/repositories/core/prisma/

# In-memory
mv src/repositories/hr/in-memory/in-memory-companies-repository.ts src/repositories/core/in-memory/
mv src/repositories/hr/in-memory/in-memory-company-addresses-repository.ts src/repositories/core/in-memory/
mv src/repositories/hr/in-memory/in-memory-company-cnaes-repository.ts src/repositories/core/in-memory/
mv src/repositories/hr/in-memory/in-memory-company-fiscal-settings-repository.ts src/repositories/core/in-memory/
mv src/repositories/hr/in-memory/in-memory-company-stakeholder-repository.ts src/repositories/core/in-memory/
```

- [ ] **Step 3: Update all imports**

Replace patterns:
- `from '@/repositories/hr/companies-repository'` → `from '@/repositories/core/companies-repository'`
- `from '@/repositories/hr/company-addresses-repository'` → `from '@/repositories/core/company-addresses-repository'`
- Same for cnaes, fiscal-settings, stakeholder
- Same for prisma and in-memory implementations

Affected files (~40): All use case files, factories, spec files.

- [ ] **Step 4: Update internal imports within moved repos** (entity/mapper references already point to `core/` from Tasks 1-2)

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: move company repositories from hr/ to core/"
```

### Task 4: Move company schemas to core

**Files:**
- Move: `src/http/schemas/hr/companies/` → `src/http/schemas/core/companies/`
- Modify: `src/http/schemas/hr/index.ts` (remove companies re-export)

- [ ] **Step 1: Create target directory and move**

```bash
cd OpenSea-API
mkdir -p src/http/schemas/core
mv src/http/schemas/hr/companies src/http/schemas/core/companies
```

- [ ] **Step 2: Update `src/http/schemas/hr/index.ts`**

Remove: `export * from './companies';`

- [ ] **Step 3: Update imports**

Replace: `from '@/http/schemas/hr/companies'` → `from '@/http/schemas/core/companies'`
Also update relative imports in admin controllers: `from '../../hr/companies/company-api-schemas'` → use absolute `from '@/http/schemas/core/companies/...'`

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Run unit tests to verify nothing broke**

```bash
cd OpenSea-API && npx vitest run src/use-cases/admin/companies/ --reporter=verbose 2>&1 | tail -20
```

Expected: All admin company unit tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: move company schemas from hr/ to core/"
```

---

## Chunk 2: Backend — Use Case Consolidation + Permission Codes

### Task 5: Move sub-resource use cases from HR to admin

**Files:**
- Move: `src/use-cases/hr/company-addresses/` → `src/use-cases/admin/company-addresses/`
- Move: `src/use-cases/hr/company-cnaes/` → `src/use-cases/admin/company-cnaes/`
- Move: `src/use-cases/hr/company-fiscal-settings/` → `src/use-cases/admin/company-fiscal-settings/`
- Move: `src/use-cases/hr/company-stakeholder/` → `src/use-cases/admin/company-stakeholder/`

- [ ] **Step 1: Move use case directories**

```bash
cd OpenSea-API
mv src/use-cases/hr/company-addresses src/use-cases/admin/company-addresses
mv src/use-cases/hr/company-cnaes src/use-cases/admin/company-cnaes
mv src/use-cases/hr/company-fiscal-settings src/use-cases/admin/company-fiscal-settings
mv src/use-cases/hr/company-stakeholder src/use-cases/admin/company-stakeholder
```

- [ ] **Step 2: Update imports in moved use cases**

These use cases import entities and repositories — already updated to `core/` in Chunk 1.
Update any remaining internal references (factory files importing from `@/repositories/hr/` that weren't caught).

- [ ] **Step 3: Update any other files that import from `@/use-cases/hr/company-*`**

Replace:
- `from '@/use-cases/hr/company-addresses'` → `from '@/use-cases/admin/company-addresses'`
- Same for cnaes, fiscal-settings, stakeholder

- [ ] **Step 4: Run unit tests for moved use cases**

```bash
cd OpenSea-API && npx vitest run src/use-cases/admin/company-addresses/ --reporter=verbose 2>&1 | tail -20
cd OpenSea-API && npx vitest run src/use-cases/admin/company-cnaes/ --reporter=verbose 2>&1 | tail -20
cd OpenSea-API && npx vitest run src/use-cases/admin/company-fiscal-settings/ --reporter=verbose 2>&1 | tail -20
cd OpenSea-API && npx vitest run src/use-cases/admin/company-stakeholder/ --reporter=verbose 2>&1 | tail -20
```

Expected: All unit tests pass in their new locations.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: move company sub-resource use cases from hr/ to admin/"
```

### Task 6: Update permission codes (MUST run before controller migration)

**Files:**
- Modify: `src/constants/rbac/permission-codes.ts`

- [ ] **Step 1: Add admin sub-resource permissions**

Add to the ADMIN section (alongside existing `COMPANIES` block):
```typescript
COMPANY_ADDRESSES: {
  CREATE: 'admin.company-addresses.create' as const,
  READ: 'admin.company-addresses.read' as const,
  UPDATE: 'admin.company-addresses.update' as const,
  DELETE: 'admin.company-addresses.delete' as const,
},
COMPANY_CNAES: {
  CREATE: 'admin.company-cnaes.create' as const,
  READ: 'admin.company-cnaes.read' as const,
  UPDATE: 'admin.company-cnaes.update' as const,
  DELETE: 'admin.company-cnaes.delete' as const,
},
COMPANY_FISCAL_SETTINGS: {
  CREATE: 'admin.company-fiscal-settings.create' as const,
  READ: 'admin.company-fiscal-settings.read' as const,
  UPDATE: 'admin.company-fiscal-settings.update' as const,
  DELETE: 'admin.company-fiscal-settings.delete' as const,
},
COMPANY_STAKEHOLDER: {
  CREATE: 'admin.company-stakeholder.create' as const,
  READ: 'admin.company-stakeholder.read' as const,
  UPDATE: 'admin.company-stakeholder.update' as const,
  DELETE: 'admin.company-stakeholder.delete' as const,
},
```

- [ ] **Step 2: Reduce HR.COMPANIES to read-only**

```typescript
COMPANIES: {
  READ: 'hr.companies.read' as const,
},
```

Remove entire blocks:
- `HR.COMPANY_ADDRESSES`
- `HR.COMPANY_CNAES`
- `HR.COMPANY_FISCAL_SETTINGS`
- `HR.COMPANY_STAKEHOLDER`

- [ ] **Step 3: Reduce FINANCE.COMPANIES to read-only**

```typescript
COMPANIES: {
  READ: 'finance.companies.read' as const,
},
```

- [ ] **Step 4: Update permission seed data** (if permissions are seeded in `prisma/seed.ts`)

Check and update seed to reflect new permission codes.

- [ ] **Step 5: Fix any references to removed permission codes**

Search for `PermissionCodes.HR.COMPANY_ADDRESSES`, `PermissionCodes.HR.COMPANY_CNAES`, etc. in controllers that haven't been moved yet. These will be fixed when controllers move in Task 7, but ensure no other files reference them.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

Note: HR sub-resource controllers still reference old permission codes — they will be moved/deleted in Task 7. Expect compile errors from those files only. If tsc is strict, temporarily keep old permission codes as aliases or handle controllers first in one batch.

**Alternative approach:** If compile errors block, merge this task with Task 7 into a single atomic commit.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: update permission codes — admin owns company sub-resources"
```

---

## Chunk 3: Backend — Controller Reorganization

### Task 7: Move sub-resource controllers to admin + rewrite HR controllers (atomic)

This task combines controller migration, HR rewrite, and HR use case cleanup into one atomic change to avoid broken intermediate states.

**Files:**
- Move: `src/http/controllers/hr/company-addresses/` → `src/http/controllers/admin/companies/addresses/`
- Move: `src/http/controllers/hr/company-cnaes/` → `src/http/controllers/admin/companies/cnaes/`
- Move: `src/http/controllers/hr/company-fiscal-settings/` → `src/http/controllers/admin/companies/fiscal-settings/`
- Move: `src/http/controllers/hr/company-stakeholder/` → `src/http/controllers/admin/companies/stakeholders/`
- Move: `src/http/controllers/hr/companies/v1-check-cnpj.controller.ts` → `src/http/controllers/admin/companies/`
- Delete: `src/http/controllers/hr/companies/v1-create-company.controller.ts`
- Delete: `src/http/controllers/hr/companies/v1-update-company.controller.ts`
- Delete: `src/http/controllers/hr/companies/v1-delete-company.controller.ts`
- Delete: `src/http/controllers/hr/companies/company-api-schemas.ts` (schemas now in core)
- Rewrite: `src/http/controllers/hr/companies/v1-list-companies.controller.ts` (read-only)
- Rewrite: `src/http/controllers/hr/companies/v1-get-company-by-id.controller.ts` (read-only)
- Rewrite: `src/http/controllers/hr/companies/routes.ts` (read-only)
- Delete: `src/use-cases/hr/companies/` (duplicate use cases)
- Modify: `src/http/controllers/admin/companies/routes.ts` (register sub-resources)
- Modify: `src/http/routes.ts` (remove HR sub-resource imports)

- [ ] **Step 1: Create target directories**

```bash
cd OpenSea-API
mkdir -p src/http/controllers/admin/companies/addresses
mkdir -p src/http/controllers/admin/companies/cnaes
mkdir -p src/http/controllers/admin/companies/fiscal-settings
mkdir -p src/http/controllers/admin/companies/stakeholders
```

- [ ] **Step 2: Move sub-resource controllers (all files including E2E tests)**

```bash
# Addresses
mv src/http/controllers/hr/company-addresses/* src/http/controllers/admin/companies/addresses/

# CNAEs
mv src/http/controllers/hr/company-cnaes/* src/http/controllers/admin/companies/cnaes/

# Fiscal Settings
mv src/http/controllers/hr/company-fiscal-settings/* src/http/controllers/admin/companies/fiscal-settings/

# Stakeholders
mv src/http/controllers/hr/company-stakeholder/* src/http/controllers/admin/companies/stakeholders/
```

- [ ] **Step 3: Move check-cnpj from HR to admin**

```bash
mv src/http/controllers/hr/companies/v1-check-cnpj.controller.ts src/http/controllers/admin/companies/
mv src/http/controllers/hr/companies/v1-check-cnpj.e2e.spec.ts src/http/controllers/admin/companies/
```

- [ ] **Step 4: Delete HR CRUD controllers and duplicate use cases**

```bash
rm src/http/controllers/hr/companies/v1-create-company.controller.ts
rm src/http/controllers/hr/companies/v1-update-company.controller.ts
rm src/http/controllers/hr/companies/v1-delete-company.controller.ts
rm src/http/controllers/hr/companies/v1-create-company.e2e.spec.ts
rm src/http/controllers/hr/companies/v1-update-company.e2e.spec.ts
rm src/http/controllers/hr/companies/v1-delete-company.e2e.spec.ts
rm src/http/controllers/hr/companies/company-api-schemas.ts
rm -rf src/use-cases/hr/companies/

# Clean up empty HR directories
rmdir src/http/controllers/hr/company-addresses/ 2>/dev/null
rmdir src/http/controllers/hr/company-cnaes/ 2>/dev/null
rmdir src/http/controllers/hr/company-fiscal-settings/ 2>/dev/null
rmdir src/http/controllers/hr/company-stakeholder/ 2>/dev/null
```

- [ ] **Step 5: Update imports in moved controllers**

Each moved controller needs:
1. Factory imports: `from '@/use-cases/hr/company-addresses/factories/...'` → `from '@/use-cases/admin/company-addresses/factories/...'`
2. Mapper imports: already `@/mappers/core/...` from Chunk 1
3. Schema imports: use absolute `from '@/http/schemas/core/companies/...'`
4. Permission codes: `PermissionCodes.HR.COMPANY_ADDRESSES.*` → `PermissionCodes.ADMIN.COMPANY_ADDRESSES.*` (created in Task 6)
5. Middleware: Replace `verifyModule('HR')` with `verifyTenant` + `createPermissionMiddleware` pattern

- [ ] **Step 6: Update sub-resource routes.ts files**

Rename exports:
- `addresses/routes.ts`: export `adminCompanyAddressesRoutes`
- `cnaes/routes.ts`: export `adminCompanyCnaesRoutes`
- `fiscal-settings/routes.ts`: export `adminCompanyFiscalSettingsRoutes`
- `stakeholders/routes.ts`: export `adminCompanyStakeholdersRoutes`

- [ ] **Step 7: Update admin companies routes.ts to register sub-resources**

```typescript
import { adminCompanyAddressesRoutes } from './addresses/routes';
import { adminCompanyCnaesRoutes } from './cnaes/routes';
import { adminCompanyFiscalSettingsRoutes } from './fiscal-settings/routes';
import { adminCompanyStakeholdersRoutes } from './stakeholders/routes';

export async function adminCompaniesRoutes(app: FastifyInstance) {
  // Existing company CRUD
  await v1CreateCompanyAdminController(app);
  await v1GetCompanyAdminController(app);
  await v1ListCompaniesAdminController(app);
  await v1UpdateCompanyAdminController(app);
  await v1DeleteCompanyAdminController(app);
  await v1RestoreCompanyAdminController(app);
  await v1CheckCnpjAdminController(app);

  // Sub-resource routes
  app.register(adminCompanyAddressesRoutes);
  app.register(adminCompanyCnaesRoutes);
  app.register(adminCompanyFiscalSettingsRoutes);
  app.register(adminCompanyStakeholdersRoutes);
}
```

- [ ] **Step 8: Rewrite HR list controller as read-only**

`src/http/controllers/hr/companies/v1-list-companies.controller.ts`:
- Middleware: `verifyJwt`, `verifyTenant`, `verifyModule('HR')`, `createPermissionMiddleware({ permissionCode: PermissionCodes.HR.COMPANIES.READ })`
- Handler: reuse `makeListCompaniesUseCase()` from `@/use-cases/admin/companies/factories/make-companies`
- URL: `GET /v1/hr/companies`

- [ ] **Step 9: Rewrite HR get-by-id controller as read-only**

`src/http/controllers/hr/companies/v1-get-company-by-id.controller.ts`:
- Same middleware pattern
- Handler: reuse `makeGetCompanyByIdUseCase()` from admin factories
- URL: `GET /v1/hr/companies/:id`

- [ ] **Step 10: Rewrite HR companies routes.ts**

```typescript
export async function companiesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));
  await v1ListCompaniesController(app);
  await v1GetCompanyByIdController(app);
}
```

- [ ] **Step 11: Update main routes.ts**

Remove HR sub-resource imports and registrations (lines 112-115 and 231-234):
```
- import { companyAddressesRoutes } from './controllers/hr/company-addresses/routes';
- import { companyCnaesRoutes } from './controllers/hr/company-cnaes/routes';
- import { companyFiscalSettingsRoutes } from './controllers/hr/company-fiscal-settings/routes';
- import { companyStakeholderRoutes } from './controllers/hr/company-stakeholder/routes';
...
- await app.register(companyAddressesRoutes);
- await app.register(companyCnaesRoutes);
- await app.register(companyFiscalSettingsRoutes);
- await app.register(companyStakeholderRoutes);
```

Sub-resources are now registered through `adminCompaniesRoutes`.

- [ ] **Step 12: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 13: Commit**

```bash
git add -A && git commit -m "refactor: move company controllers to admin, rewrite HR as read-only"
```

### Task 8: Create Finance companies read-only controllers

**Files:**
- Create: `src/http/controllers/finance/companies/routes.ts`
- Create: `src/http/controllers/finance/companies/v1-list-companies.controller.ts`
- Create: `src/http/controllers/finance/companies/v1-get-company-by-id.controller.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/http/controllers/finance/companies
```

- [ ] **Step 2: Create list controller**

`v1-list-companies.controller.ts`:
- Middleware: `verifyJwt`, `verifyTenant`, `verifyModule('FINANCE')`, `createPermissionMiddleware({ permissionCode: PermissionCodes.FINANCE.COMPANIES.READ })`
- Handler: reuse `makeListCompaniesUseCase()` from `@/use-cases/admin/companies/factories/make-companies`
- URL: `GET /v1/finance/companies`
- Schema tags: `['Finance - Companies']`

- [ ] **Step 3: Create get-by-id controller**

`v1-get-company-by-id.controller.ts`:
- Same middleware pattern
- URL: `GET /v1/finance/companies/:id`

- [ ] **Step 4: Create routes.ts**

```typescript
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1ListCompaniesController } from './v1-list-companies.controller';
import { v1GetCompanyByIdController } from './v1-get-company-by-id.controller';

export async function financeCompaniesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('FINANCE'));
  await v1ListCompaniesController(app);
  await v1GetCompanyByIdController(app);
}
```

- [ ] **Step 5: Register in main routes.ts**

```typescript
import { financeCompaniesRoutes } from './controllers/finance/companies/routes';
// ... register alongside other finance routes:
await app.register(financeCompaniesRoutes);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd OpenSea-API && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add finance/companies read-only controllers"
```

---

## Chunk 4: Backend — Tests

### Task 9: Update E2E tests for admin sub-resource controllers

**Files:**
- Already moved with controllers in Task 7 Step 2
- Update: `src/http/controllers/admin/companies/addresses/*.e2e.spec.ts`
- Update: `src/http/controllers/admin/companies/cnaes/*.e2e.spec.ts`
- Update: `src/http/controllers/admin/companies/fiscal-settings/*.e2e.spec.ts`
- Update: `src/http/controllers/admin/companies/stakeholders/*.e2e.spec.ts`
- Update: `src/http/controllers/admin/companies/v1-check-cnpj.e2e.spec.ts`

- [ ] **Step 1: Update URL paths in all moved E2E tests**

Replace in each test file:
- `/v1/hr/companies/:companyId/addresses` → `/v1/admin/companies/:companyId/addresses`
- `/v1/hr/companies/:companyId/cnaes` → `/v1/admin/companies/:companyId/cnaes`
- `/v1/hr/companies/:companyId/fiscal-settings` → `/v1/admin/companies/:companyId/fiscal-settings`
- `/v1/hr/companies/:companyId/stakeholders` → `/v1/admin/companies/:companyId/stakeholders`
- `/v1/hr/companies/check-cnpj` → `/v1/admin/companies/check-cnpj`

Also update permission references from `PermissionCodes.HR.*` to `PermissionCodes.ADMIN.*`.

- [ ] **Step 2: Update HR list/get E2E tests**

Update remaining tests (`v1-list-companies.e2e.spec.ts`, `v1-get-company-by-id.e2e.spec.ts`) to test read-only behavior with `hr.companies.read` permission.

- [ ] **Step 3: Run E2E tests for admin companies**

```bash
cd OpenSea-API && npx vitest run src/http/controllers/admin/companies/ --config vitest.e2e.config.ts --reporter=verbose 2>&1 | tail -30
```

- [ ] **Step 4: Run all unit tests**

```bash
cd OpenSea-API && npx vitest run --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test: update company E2E tests for admin ownership"
```

### Task 10: Create Finance companies E2E tests

**Files:**
- Create: `src/http/controllers/finance/companies/v1-list-companies.e2e.spec.ts`
- Create: `src/http/controllers/finance/companies/v1-get-company-by-id.e2e.spec.ts`

- [ ] **Step 1: Write list companies E2E test**

Test: authenticated user with `finance.companies.read` permission can list companies at `GET /v1/finance/companies`. Verify 200 response with company data. Verify 403 without permission.

- [ ] **Step 2: Write get-by-id E2E test**

Test: authenticated user can get single company at `GET /v1/finance/companies/:id`. Verify 200 with company details. Verify 404 for nonexistent. Verify 403 without permission.

- [ ] **Step 3: Run the tests**

```bash
cd OpenSea-API && npx vitest run src/http/controllers/finance/companies/ --config vitest.e2e.config.ts --reporter=verbose
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test: add finance/companies read-only E2E tests"
```

---

## Chunk 5: Frontend — Companies Move to Admin

### Task 11: Move HR companies frontend to admin

**Files:**
- Move: `src/app/(dashboard)/(modules)/hr/(entities)/companies/` → `src/app/(dashboard)/(modules)/admin/(entities)/companies/`

- [ ] **Step 1: Move the directory**

```bash
cd OpenSea-APP
mv "src/app/(dashboard)/(modules)/hr/(entities)/companies" "src/app/(dashboard)/(modules)/admin/(entities)/companies"
```

- [ ] **Step 2: Update API endpoints in queries/mutations**

In all files under `admin/(entities)/companies/src/api/`:
- Replace `/v1/hr/companies` → `/v1/admin/companies`
- Replace any references to HR-specific endpoints for sub-resources

- [ ] **Step 3: Update permission references**

In config files and any permission checks, update from `hr.companies.*` to `admin.companies.*`.

- [ ] **Step 4: Update internal imports** (relative paths may break after move)

Check all files for relative imports referencing `../../_shared/` or other HR-specific paths. Update to reference admin `_shared/` equivalents.

- [ ] **Step 5: Verify build**

```bash
cd OpenSea-APP && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: move companies frontend from hr/ to admin/"
```

### Task 12: Delete finance companies frontend duplicate

**Files:**
- Delete: `src/app/(dashboard)/(modules)/finance/companies/` (43 files — note: NOT under `(entities)/`)

- [ ] **Step 1: Delete the duplicate**

```bash
cd OpenSea-APP
rm -rf "src/app/(dashboard)/(modules)/finance/companies"
```

- [ ] **Step 2: Verify build**

```bash
cd OpenSea-APP && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "refactor: remove duplicate finance/companies frontend (lives in admin)"
```

### Task 13: Create HR companies read-only view

**Files:**
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/page.tsx`
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/[id]/page.tsx`
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/src/api/keys.ts`
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/src/api/list-companies.query.ts`
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/src/api/get-company.query.ts`
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/src/api/index.ts`
- Create: `src/app/(dashboard)/(modules)/hr/(entities)/companies/src/index.ts`

- [ ] **Step 1: Create directory structure**

```bash
cd OpenSea-APP
mkdir -p "src/app/(dashboard)/(modules)/hr/(entities)/companies/[id]"
mkdir -p "src/app/(dashboard)/(modules)/hr/(entities)/companies/src/api"
```

- [ ] **Step 2: Create API query hooks**

`keys.ts` — query key factory for HR companies
`list-companies.query.ts` — calls `GET /v1/hr/companies`, returns paginated list
`get-company.query.ts` — calls `GET /v1/hr/companies/:id`
`index.ts` — barrel re-exports

Follow existing patterns from other entity query files in the project.

- [ ] **Step 3: Create list page**

`page.tsx`:
- Standard entity list with table/grid
- No create/edit/delete actions
- "Gerenciar no Admin" button linking to `/admin/companies/:id`
- Uses `useListHrCompanies` query

- [ ] **Step 4: Create detail page**

`[id]/page.tsx`:
- Read-only company detail view
- Shows basic company info (legalName, tradeName, cnpj, status)
- "Gerenciar no Admin" button linking to `/admin/companies/:id`

- [ ] **Step 5: Verify build**

```bash
cd OpenSea-APP && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: create hr/companies read-only view"
```

### Task 14: Create Finance companies read-only view

**Files:**
- Create: `src/app/(dashboard)/(modules)/finance/companies/page.tsx`
- Create: `src/app/(dashboard)/(modules)/finance/companies/[id]/page.tsx`
- Create: `src/app/(dashboard)/(modules)/finance/companies/src/api/keys.ts`
- Create: `src/app/(dashboard)/(modules)/finance/companies/src/api/list-companies.query.ts`
- Create: `src/app/(dashboard)/(modules)/finance/companies/src/api/get-company.query.ts`
- Create: `src/app/(dashboard)/(modules)/finance/companies/src/api/index.ts`
- Create: `src/app/(dashboard)/(modules)/finance/companies/src/index.ts`

Note: Finance does NOT use `(entities)` route group — companies lives directly at `finance/companies/`.

- [ ] **Step 1: Create directory structure**

```bash
cd OpenSea-APP
mkdir -p "src/app/(dashboard)/(modules)/finance/companies/[id]"
mkdir -p "src/app/(dashboard)/(modules)/finance/companies/src/api"
```

- [ ] **Step 2: Create API query hooks**

Same pattern as HR but calling `/v1/finance/companies` endpoints.

- [ ] **Step 3: Create list page**

Same pattern as HR read-only list but with Finance context.

- [ ] **Step 4: Create detail page**

Same pattern as HR read-only detail.

- [ ] **Step 5: Verify build**

```bash
cd OpenSea-APP && npm run build 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: create finance/companies read-only view"
```

---

## Chunk 6: Documentation

### Task 15: Create backend admin module documentation

**Files:**
- Create: `OpenSea-API/docs/modules/admin.md`

- [ ] **Step 1: Write documentation**

Document:
- Module overview (tenant-level administration)
- Entities: companies (full CRUD + sub-resources), link to core/users, core/teams, rbac
- All endpoints with methods, URLs, permissions
- Permission codes table
- Architecture notes (entities in core/, use cases in admin/, controllers in admin/)

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add docs/modules/admin.md && git commit -m "docs: create admin module documentation"
```

### Task 16: Create frontend admin module documentation

**Files:**
- Create: `OpenSea-APP/docs/modules/admin.md`

- [ ] **Step 1: Write documentation**

Document:
- Module overview
- Entities: users, teams, permission-groups, companies, audit-logs
- Page structure and routes
- Modals and components per entity
- API hooks consumed

- [ ] **Step 2: Commit**

```bash
cd OpenSea-APP && git add docs/modules/admin.md && git commit -m "docs: create admin module documentation"
```

### Task 17: Update HR and Finance docs

**Files:**
- Modify: `OpenSea-API/docs/modules/hr.md`
- Modify: `OpenSea-APP/docs/modules/hr.md`
- Modify: `OpenSea-APP/docs/modules/finance.md`

- [ ] **Step 1: Update backend HR docs**

Remove companies CRUD section. Add note:
> Companies is a shared entity managed by the Admin module. HR has read-only access via `GET /v1/hr/companies` with `hr.companies.read` permission.

- [ ] **Step 2: Update frontend HR docs**

Document that companies page is read-only with link to admin.

- [ ] **Step 3: Update frontend Finance docs**

Document that finance/companies is read-only with link to admin.

- [ ] **Step 4: Commit**

```bash
cd OpenSea-API && git add docs/modules/hr.md && git commit -m "docs: update hr module — companies is now read-only"
cd OpenSea-APP && git add docs/modules/hr.md docs/modules/finance.md && git commit -m "docs: update hr and finance — companies is read-only"
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Move entities, mappers, repos, schemas from hr/ to core/ (+ barrel updates) |
| 2 | 5-6 | Consolidate use cases under admin/, update permission codes |
| 3 | 7-8 | Move controllers to admin, rewrite HR as read-only, create Finance read-only |
| 4 | 9-10 | Update E2E tests, create Finance E2E tests |
| 5 | 11-14 | Frontend: move to admin, delete duplicate, create read-only views |
| 6 | 15-17 | Documentation |

**Total tasks:** 17
**Total commits:** ~13
**Estimated file changes:** ~200+ files

**Key dependency order:**
1. Entities → Mappers → Repos → Schemas (each builds on previous)
2. Permission codes (Task 6) MUST complete before controller migration (Task 7)
3. HR use case deletion + HR controller rewrite happen atomically (Task 7) to avoid broken state
