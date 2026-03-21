# ADR-003: RBAC Permission Pattern

## Status: Accepted
## Date: 2025-09-01 (updated 2026-03-21)

## Context

The platform needs fine-grained access control across 7 UI-aligned modules with:
- Per-resource permissions using humanized actions
- Group-based permission assignment
- Permission checks that don't bloat JWT tokens
- Intuitive permission codes that non-technical administrators can understand

## Decision

### Permission Code Format

Permissions follow one of two formats:

- **3 levels:** `{module}.{resource}.{action}` — used by most modules
- **4 levels:** `{module}.{group}.{resource}.{action}` — used by the `tools` module only

Examples:
- `stock.products.register`
- `finance.entries.access`
- `tools.email.accounts.access`
- `tools.tasks.boards.admin`
- `admin.users.admin`

### 7 UI-Aligned Modules

| Module | Description |
|--------|-------------|
| `stock` | Products, Variants, Templates, Categories, Manufacturers, Items, Purchase Orders, Volumes, Warehouses |
| `finance` | Categories, Cost Centers, Bank Accounts, Suppliers, Contracts, Entries, Consortia, Loans, Recurring |
| `hr` | Positions, Departments, Work Schedules, Employees, Vacations, Absences, Payroll, Time Control |
| `sales` | Customers, Promotions, Orders |
| `admin` | Users, Permission Groups, Companies, Sessions, Audit |
| `tools` | Email (accounts/messages), Tasks (boards/cards), Calendar, Storage (folders/files) |
| `system` | Label Templates, Notifications, Self (profile) |

### 10 Humanized Actions

| Action | Label (PT-BR) | Description |
|--------|--------------|-------------|
| `access` | Acessar | List + read (merged) |
| `register` | Cadastrar | Create new records |
| `modify` | Alterar | Update existing records |
| `remove` | Remover | Delete records |
| `import` | Importar | Import data |
| `export` | Exportar | Export data |
| `print` | Imprimir | Print data |
| `admin` | Administrar | Full management access |
| `share` | Compartilhar | Share resources |
| `onlyself` | Próprio | Restrict to own records only (UI-only for now) |

### 243 Permission Codes

The system contains 243 permission codes total, a 67% reduction from the previous 721 codes.

### Middleware Factories

Permissions are assigned to **groups** (roles), and users belong to groups. Permission checks are done at the middleware level via middleware factories:

- `createPermissionMiddleware('code')` — single permission check
- `createAnyPermissionMiddleware(['a', 'b'])` — any of the listed (OR)
- `createAllPermissionsMiddleware(['a', 'b'])` — all required (AND)

Permissions are NOT included in the JWT. Instead, `PermissionService.getUserPermissionCodes()` is called during middleware checks.

### Wildcard Support

The `*` character can substitute any segment. Both sides must have the same number of segments:

```
"stock.products.register" matches "stock.*.register"   ✓
"stock.products.register" matches "*.*.*"               ✓
"tools.email.accounts.access" matches "tools.email.*.*" ✓
"tools.email.accounts.access" matches "tools.*.*.*"     ✓
```

Super admin wildcard: `*.*.*` matches all 3-level codes, `*.*.*.*` matches all 4-level codes.

### Default Groups

Two system groups (`isSystem: true`) are created during seed:

| Slug | Permissions | Description |
|------|-------------|-------------|
| `admin` | All 243 permissions | Full access to every resource |
| `user` | 27 permissions | Tools productivity + system.self |

### Three-Layer Cache

- **L1**: In-memory `Map` with TTL — zero-latency for repeated checks within the same process
- **L2**: Redis with configurable TTL — shared across instances
- **L3**: PostgreSQL — source of truth, queried only on cache miss

`PermissionService` is a singleton (`_permissionService` in `verify-permission.ts`).

## Consequences

**Positive:**
- 243 permission codes across 7 modules — intuitive for non-technical admins
- Humanized actions are self-documenting in Portuguese
- UI-aligned modules create a consistent mental model between frontend and backend
- 4-level support for tools module enables wildcard grouping (e.g., `tools.email.*`)
- Middleware pattern is declarative: `preHandler: [verifyJwt, verifyPermission('x')]`
- L1/L2/L3 cache eliminates DB hits for 99%+ of permission checks
- Menu visibility derived from `*.access` — no separate `ui.menu.*` codes needed

**Negative:**
- Cache invalidation complexity across 3 layers
- `onlyself` behavior not yet enforced in middleware (UI-only for now)
- Mixed 3-level and 4-level codes require careful wildcard handling
