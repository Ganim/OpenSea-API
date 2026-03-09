# ADR-002: Multi-Tenant JWT Scoping

## Status: Accepted
## Date: 2025-08-01

## Context

OpenSea supports multiple tenants (companies) with a single user potentially belonging to multiple tenants. We needed a mechanism to:
- Authenticate users once
- Allow tenant selection post-login
- Scope all subsequent API calls to a specific tenant
- Prevent cross-tenant data access

## Decision

Use a two-phase JWT flow:

1. **Phase 1 — Authentication:** User logs in with credentials → receives a JWT with `userId` and `isSuperAdmin` flag (no `tenantId`).
2. **Phase 2 — Tenant Selection:** User calls `POST /v1/auth/select-tenant` → receives a new JWT with `tenantId` included.

All tenant-scoped routes use `verifyTenant` middleware that extracts `tenantId` from the JWT and passes it to use cases. Repositories filter all queries by `tenantId`.

Super admins bypass tenant selection for admin routes (protected by `verifySuperAdmin` middleware).

## Consequences

**Positive:**
- Tenant isolation enforced at every layer (middleware → use case → repository)
- Users can switch tenants without re-authenticating
- JWT is stateless — no server-side session lookup for tenant context

**Negative:**
- Tenant selection adds an extra HTTP round-trip after login
- JWT must be refreshed when switching tenants
- All repository methods require `tenantId` parameter (verbose but safe)
