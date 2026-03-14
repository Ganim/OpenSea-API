# Admin Module — Companies Reorganization

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Backend (OpenSea-API) + Frontend (OpenSea-APP) + Documentation

## Context

Companies is a shared entity representing the businesses managed by a tenant. Currently, the CRUD is duplicated across `admin/companies` (tenant-scoped admin) and `hr/companies` (HR module), with identical frontend implementations in both `hr/(entities)/companies/` and `finance/companies/`.

The correct domain boundary: **Admin owns the full CRUD** of companies and all sub-resources. HR and Finance consume companies as read-only views with their own module-specific permissions.

## Decision

### Backend — Entity Layer Migration

Move company entities, repositories, mappers, and schemas from `hr/` to `core/` (shared domain):

| Layer | From (`hr/`) | To (`core/`) |
|-------|-------------|-------------|
| Entities | `entities/hr/company.ts`, `company-address.ts`, `company-cnae.ts`, `company-fiscal-settings.ts`, `company-stakeholder.ts` | `entities/core/company.ts`, etc. |
| Repositories (interfaces) | `repositories/hr/companies-repository.ts`, `company-addresses-repository.ts`, `company-cnaes-repository.ts`, `company-fiscal-settings-repository.ts`, `company-stakeholder-repository.ts` | `repositories/core/` |
| Repositories (Prisma) | `repositories/hr/prisma/prisma-companies-repository.ts` + 4 sub-resource repos | `repositories/core/prisma/` |
| Repositories (In-Memory) | `repositories/hr/in-memory/in-memory-company-*.ts` (5 files) | `repositories/core/in-memory/` |
| Mappers | `mappers/hr/company/`, `company-address/`, `company-cnae/`, `company-fiscal-settings/`, `company-stakeholder/` | `mappers/core/` (same subdirs) |
| Schemas | `http/schemas/hr/companies/` | `http/schemas/core/companies/` |

**~164 files** importing from `hr/company*` paths need updating to `core/company*`.

### Backend — Controller Ownership

#### Admin (CRUD completo)

`controllers/admin/companies/` owns full CRUD + all sub-resources.

**Company CRUD** (existing, stays in place):
- `POST /v1/admin/companies` — create
- `GET /v1/admin/companies` — list
- `GET /v1/admin/companies/:id` — get by id
- `PUT /v1/admin/companies/:id` — update
- `DELETE /v1/admin/companies/:id` — delete (soft)
- `POST /v1/admin/companies/:id/restore` — restore
- `GET /v1/admin/companies/check-cnpj/:cnpj` — check CNPJ (move from `hr/companies/v1-check-cnpj.controller.ts`)

**Sub-resource CRUD** (move from `controllers/hr/company-*` to `controllers/admin/`):

| Resource | New URL Pattern | Endpoints |
|----------|----------------|-----------|
| Addresses | `/v1/admin/companies/:companyId/addresses` | create, list, update `:id`, delete `:id` |
| CNAEs | `/v1/admin/companies/:companyId/cnaes` | create, list, get `:id`, get-primary, update `:id`, delete `:id` |
| Fiscal Settings | `/v1/admin/companies/:companyId/fiscal-settings` | create, get, update, delete |
| Stakeholders | `/v1/admin/companies/:companyId/stakeholders` | create, get, update `:id`, delete `:id` |

All controllers use: `verifyJwt`, `verifyTenant`, `createPermissionMiddleware({ permissionCode: PermissionCodes.ADMIN.COMPANIES.* })`

**Route registration:** Extend `controllers/admin/companies/routes.ts` to register sub-resource routes. Add sub-resource files in subdirectories:
```
controllers/admin/companies/
  routes.ts              (updated — registers all sub-routes)
  v1-*.ts                (existing company CRUD)
  addresses/
    v1-create-company-address.controller.ts
    v1-list-company-addresses.controller.ts
    v1-update-company-address.controller.ts
    v1-delete-company-address.controller.ts
  cnaes/
    v1-create-company-cnae.controller.ts
    ...
  fiscal-settings/
    v1-create-company-fiscal-settings.controller.ts
    ...
  stakeholders/
    v1-create-company-stakeholder.controller.ts
    ...
```

#### HR (Read-Only)

`controllers/hr/companies/` reduced to 2 endpoints:

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/v1/hr/companies` | `hr.companies.read` |
| GET | `/v1/hr/companies/:id` | `hr.companies.read` |

Middleware: `verifyJwt`, `verifyTenant`, `verifyModule('HR')`, `verifyPermission('hr.companies.read')`

Reuses `ListCompaniesUseCase` and `GetCompanyByIdUseCase` from admin.

**Remove:** All other HR company controllers (create, update, delete, check-cnpj) and all sub-resource controller directories (`company-addresses/`, `company-cnaes/`, `company-fiscal-settings/`, `company-stakeholder/`).

**Route registration:** Update `controllers/hr/companies/routes.ts` to only register list + get. Remove sub-resource route imports from HR `routes.ts`.

#### Finance (Read-Only — New)

`controllers/finance/companies/` — 2 new endpoints:

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/v1/finance/companies` | `finance.companies.read` |
| GET | `/v1/finance/companies/:id` | `finance.companies.read` |

Middleware: `verifyJwt`, `verifyTenant`, `verifyModule('FINANCE')`, `verifyPermission('finance.companies.read')`

Reuses same use cases from admin.

**Route registration:** Create `controllers/finance/companies/routes.ts`, register in finance routes.

### Backend — Use Cases

| Action | Detail |
|--------|--------|
| `use-cases/admin/companies/` | Keeps full CRUD |
| Move sub-resources to admin | `use-cases/hr/company-addresses/*` → `use-cases/admin/company-addresses/*` |
| | `use-cases/hr/company-cnaes/*` → `use-cases/admin/company-cnaes/*` |
| | `use-cases/hr/company-fiscal-settings/*` → `use-cases/admin/company-fiscal-settings/*` |
| | `use-cases/hr/company-stakeholder/*` → `use-cases/admin/company-stakeholder/*` |
| `use-cases/hr/companies/` | **Remove** — duplicate of admin |

### Backend — Permissions

**Existing permissions (already in `permission-codes.ts`):**

| Module | Permissions | Action |
|--------|------------|--------|
| `admin.companies.*` | create, read, update, delete, restore | **Keep** — admin CRUD |
| `hr.companies.read` | read | **Keep** — HR read-only |
| `hr.companies.{create,update,delete,list,manage}` | CRUD | **Remove** — no longer used |
| `finance.companies.read` | read | **Keep** — Finance read-only |
| `finance.companies.{create,update,delete,list,manage}` | CRUD | **Remove** — no longer used |

Sub-resource permissions (e.g., `hr.company-addresses.*`, `hr.company-cnaes.*`) move to `admin.company-addresses.*`, `admin.company-cnaes.*`, etc.

### Backend — Tests

**E2E tests:**
- HR company E2E tests (`controllers/hr/companies/*.e2e.spec.ts`): Remove CRUD tests, keep/create read-only tests for list + get
- HR sub-resource E2E tests (`controllers/hr/company-addresses/*.e2e.spec.ts`, etc.): Move to `controllers/admin/companies/addresses/` etc., update URL prefix from `/v1/hr/companies/:companyId/addresses` to `/v1/admin/companies/:companyId/addresses`
- Finance: Create new E2E tests for read-only endpoints
- Admin: Existing E2E tests stay, add tests for sub-resources and check-cnpj

**Unit tests:**
- `use-cases/admin/companies/*.spec.ts`: Keep
- `use-cases/hr/companies/*.spec.ts`: Remove (duplicates)
- Sub-resource unit tests: Move alongside their use cases to `use-cases/admin/company-*/*.spec.ts`

**Factories:**
- `use-cases/admin/companies/factories/make-companies.ts`: Keep
- `use-cases/hr/companies/factories/make-companies.ts`: Remove (duplicate)
- Sub-resource factories: Move to `use-cases/admin/company-*/factories/`

### Frontend — Admin Owns CRUD

Move `hr/(entities)/companies/` (43 files) to `admin/(entities)/companies/`. Delete `finance/companies/` (43 duplicate files at `finance/companies/`, note: NOT under `(entities)/`).

Admin companies includes: list page, detail page `[id]`, edit page `[id]/edit`, plus modals for create, edit, delete, addresses, cnaes, fiscal-settings, stakeholders, cnpj-lookup.

Update API endpoints in queries/mutations from `/v1/hr/companies` to `/v1/admin/companies`.

### Frontend — HR Read-Only View

Recreate `hr/(entities)/companies/` as simplified read-only:

- `page.tsx` — List (calls `GET /v1/hr/companies`)
- `[id]/page.tsx` — Detail (calls `GET /v1/hr/companies/:id`)
- `src/api/` — Queries using HR endpoints
- No create/edit/delete modals
- "Gerenciar no Admin" button linking to `/admin/companies/:id`

### Frontend — Finance Read-Only View

Recreate `finance/(entities)/companies/` as simplified read-only:

- `page.tsx` — List (calls `GET /v1/finance/companies`)
- `[id]/page.tsx` — Detail (calls `GET /v1/finance/companies/:id`)
- `src/api/` — Queries using Finance endpoints
- No create/edit/delete modals
- "Gerenciar no Admin" button linking to `/admin/companies/:id`

### Documentation

| File | Action |
|------|--------|
| `OpenSea-API/docs/modules/admin.md` | **Create** — Admin tenant module: companies CRUD + sub-resources, permissions, cross-ref with core/users, core/teams, rbac |
| `OpenSea-APP/docs/modules/admin.md` | **Create** — Admin frontend: users, teams, permission-groups, companies, audit-logs |
| `OpenSea-API/docs/modules/hr.md` | **Update** — Remove companies CRUD, document read-only access via `hr.companies.read` |
| `OpenSea-APP/docs/modules/hr.md` | **Update** — Companies is read-only, CRUD lives in admin |
| `OpenSea-APP/docs/modules/finance.md` | **Update** — Document finance/companies as read-only |

## Files Affected (Estimated)

- **Moved/renamed:** ~35 files (entities, repos, mappers, schemas)
- **Import updates:** ~164 files
- **Controllers removed:** ~24 files (HR CRUD companies + 4 sub-resource controller dirs)
- **Controllers moved to admin:** ~16 files (sub-resource controllers restructured)
- **Controllers created:** ~5 files (HR read-only + Finance read-only + check-cnpj in admin)
- **E2E tests moved/updated:** ~20+ files (URL changes + permission changes)
- **Unit tests removed:** ~8 files (HR company duplicates)
- **Frontend moved:** ~43 files (hr/companies → admin/companies)
- **Frontend removed:** ~43 files (finance/companies duplicate)
- **Frontend created:** ~12 files (HR + Finance read-only views)
- **Docs created/updated:** 5 files
- **Route registrations updated:** 3 files (admin routes.ts, hr routes.ts, finance routes.ts)
- **Permission codes updated:** 1 file (remove HR/Finance CRUD, add admin sub-resource permissions)
