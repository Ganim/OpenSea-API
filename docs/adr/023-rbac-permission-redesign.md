# ADR 023: RBAC Permission System Redesign

## Status
Accepted (2026-03-21)

## Context
The original permission system had 721 codes organized by technical backend modules (core, rbac, audit, calendar, email, storage, tasks, notifications, self, ui, reports, data, settings, requests). This caused several problems:
- Too granular: many codes were never used (e.g., `stock.bins.search`, `ui.menu.stock.variants`)
- Technical naming: actions like `list`, `read`, `create`, `update`, `delete`, `manage` meant nothing to administrators configuring permissions
- Module mismatch: backend modules didn't align with the UI, making the permission editor confusing
- Scope pattern: `.all`/`.team` suffixes for HR created 4-part codes that added complexity

## Decision
Complete redesign from scratch:

### 1. Reduce from 721 to 243 codes (67% reduction)
- Eliminate redundant modules: ui.*, reports.*, data.*, settings.*, requests.*
- Consolidate sub-resources into parent resources (zones/bins → warehouses, attachments → products)
- Menu visibility derived from `*.access` instead of separate `ui.menu.*` codes

### 2. Humanize actions (10 actions)
| Action | Label (PT-BR) | Replaces |
|--------|--------------|----------|
| access | Acessar | list + read (merged) |
| register | Cadastrar | create |
| modify | Alterar | update |
| remove | Remover | delete |
| import | Importar | data.import.* |
| export | Exportar | data.export.* |
| print | Imprimir | data.print.* |
| admin | Administrar | manage |
| share | Compartilhar | share-user + share-group |
| onlyself | Próprio | .all/.team scopes |

### 3. Align modules with UI (7 modules)
| Module | Contains |
|--------|----------|
| stock | Products, Variants, Templates, Categories, Manufacturers, Items, Purchase Orders, Volumes, Warehouses |
| finance | Categories, Cost Centers, Bank Accounts, Suppliers, Contracts, Entries, Consortia, Loans, Recurring |
| hr | Positions, Departments, Work Schedules, Employees, Vacations, Absences, Payroll, Time Control |
| sales | Customers, Promotions, Orders |
| admin | Users, Permission Groups, Companies, Sessions, Audit |
| tools | Email (accounts/messages), Tasks (boards/cards), Calendar, Storage (folders/files) |
| system | Label Templates, Notifications, Self (profile) |

### 4. Support 4-level codes for tools module (see also ADR 024)
- `tools.email.accounts.access` instead of `tools.email-accounts.access`
- Enables wildcard grouping: `tools.email.*` matches all email permissions
- Only tools uses 4 levels; other modules stay at 3
- `parsePermissionCode()` helper decomposes codes into `{ module, resource, action }` — sub-resource absorbed into `resource` field

### 5. Default groups
- **Admin**: All 243 permissions
- **User**: 27 permissions (tools productivity + system.self)

## Consequences

### Positive
- Permission editor is intuitive for non-technical admins
- Fewer codes = less noise, easier to audit
- UI-aligned modules = consistent mental model
- Humanized actions = self-documenting
- 4-level support = future-proof for nested resources (Sales bids module)

### Negative
- Breaking change: all existing group-permission associations need migration
- All controllers needed remapping (~483 files)
- All frontend permission checks needed updating (~62 files)
- E2E test factories need updating (deferred)
- `onlyself` behavior not yet enforced in middleware (UI-only for now)

### Migration
- Standalone script: `prisma/migrate-permissions.ts`
- Idempotent: creates new, deletes old, reassigns Admin/User groups across all tenants
- Custom groups: reassigned manually by admin via the permission matrix UI
