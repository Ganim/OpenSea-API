# ADR-003: RBAC Permission Pattern

## Status: Accepted
## Date: 2025-09-01 (updated 2026-03-10)

## Context

The platform needed fine-grained access control across 14+ modules with:
- Per-resource CRUD permissions
- Scope-based access (e.g., read own vs. read all)
- Group-based permission assignment
- Permission checks that don't bloat JWT tokens

## Decision

Permissions follow the pattern: `{module}.{resource}.{action}[.{scope}]`

Examples:
- `stock.products.create`
- `stock.products.read.all`
- `hr.employees.update`
- `finance.entries.delete`

Permissions are assigned to **groups** (roles), and users belong to groups. Permission checks are done at the middleware level via middleware factories:

- `createPermissionMiddleware('code')` — single permission (AND)
- `createAnyPermissionMiddleware(['a', 'b'])` — any of the listed (OR)
- `createAllPermissionsMiddleware(['a', 'b'])` — all required (AND)

Permissions are NOT included in the JWT (originally they were, but this made tokens ~4KB). Instead, `PermissionService.getUserPermissionCodes()` is called during middleware checks.

**Three-layer cache** (added 2026-02):
- **L1**: In-memory `Map` with TTL — zero-latency for repeated checks within the same process
- **L2**: Redis with configurable TTL — shared across instances
- **L3**: PostgreSQL — source of truth, queried only on cache miss

`PermissionService` is a singleton (`_permissionService` in `verify-permission.ts`) — previously it was creating a new instance per request, causing cache misses.

## Consequences

**Positive:**
- Granular control: 761+ distinct permission codes across 14 modules
- Permission changes take effect immediately (no token refresh needed)
- Groups simplify role management (Admin, Manager, Viewer, etc.)
- Middleware pattern is declarative: `preHandler: [verifyJwt, verifyPermission('x')]`
- L1/L2/L3 cache eliminates DB hits for 99%+ of permission checks

**Negative:**
- Cache invalidation complexity across 3 layers
- Permission seeding requires careful management across migrations
- Adding a new module requires adding ~6-10 permission codes
