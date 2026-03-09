# ADR-003: RBAC Permission Pattern

## Status: Accepted
## Date: 2025-09-01

## Context

The platform needed fine-grained access control across 8+ modules with:
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

Permissions are assigned to **groups** (roles), and users belong to groups. Permission checks are done at the middleware level via `verifyPermission('permission.code')` which queries the database.

Permissions are NOT included in the JWT (originally they were, but this made tokens ~4KB). Instead, `PermissionService.getUserPermissionCodes()` is called during middleware checks.

## Consequences

**Positive:**
- Granular control: 100+ distinct permissions
- Permission changes take effect immediately (no token refresh needed)
- Groups simplify role management (Admin, Manager, Viewer, etc.)
- Middleware pattern is declarative: `preHandler: [verifyJwt, verifyPermission('x')]`

**Negative:**
- Every authorized request hits the database for permission check (mitigated by Redis caching)
- Permission seeding requires careful management across migrations
- Adding a new module requires adding ~6-10 permission codes
