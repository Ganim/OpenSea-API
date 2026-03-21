# ADR 026: Finance Module Middleware & UX Standardization

## Status
Accepted (2026-03-21)

## Context

An audit of the Finance module revealed 17 issues across backend and frontend. The most critical:

1. **All 75 Finance controllers used `onRequest` instead of `preHandler`** — Fastify's `onRequest` runs before body parsing, meaning request body isn't available. All other modules (Stock, HR, Sales) use `preHandler`. This inconsistency could cause subtle bugs in permission checks or middleware that need request body.

2. **Detail pages used `confirm()` for destructive actions** — The bank-accounts and cost-centers detail pages used browser `confirm()` + `alert('será implementada')` instead of `VerifyActionPinModal`. This violated the project's security pattern (PIN confirmation for all destructive actions).

3. **Delete buttons not permission-gated** — Delete buttons rendered regardless of user permissions, violating the "hide, don't disable" RBAC pattern.

## Decision

### 1. Bulk replace `onRequest` → `preHandler` in all Finance controllers
- 75 files, 76 occurrences
- Mechanical find-and-replace, no logic changes

### 2. Replace `confirm()` with `VerifyActionPinModal` in detail pages
- Bank accounts: `finance/(entities)/bank-accounts/[id]/page.tsx`
- Cost centers: `finance/(entities)/cost-centers/[id]/page.tsx`
- Both now use `useDeleteBankAccount()`/`useDeleteCostCenter()` mutations with proper toast feedback and navigation

### 3. Add permission gating to delete buttons
- Both detail pages now check `hasPermission(PermissionCodes.FINANCE.*.REMOVE)` before rendering delete buttons
- Color changed from `text-red-800` to `text-rose-600` (project standard)

### 4. Deferred: Plan limits middleware (FIX B2)
- Finance CREATE endpoints lack `createPlanLimitsMiddleware`
- Deferred because the Plan model needs schema extensions (maxEntries, maxBankAccounts, etc.) which are part of the Central Redesign (separate workstream)

## Consequences

### Positive
- Finance controllers now consistent with all other modules
- Destructive actions require PIN confirmation (security)
- Permission-gated UI hides unauthorized actions
- Reduced attack surface (no browser-level confirm bypass)

### Negative
- None — all changes are corrections toward existing patterns

### Files Changed
- 75 backend controller files (`onRequest` → `preHandler`)
- 2 frontend detail pages (VerifyActionPinModal + permission gating)
- 3 backend Zod query schemas (entries, loans, consortia) — added `.describe()` for Swagger documentation
- 3 frontend listing pages (receivable, payable, loans) — migrated from traditional pagination to infinite scroll with IntersectionObserver
- 2 frontend edit pages (bank-accounts, cost-centers) — replaced redirect stubs with full edit forms following PageLayout pattern
- 4 frontend detail pages (bank-accounts, cost-centers, payable, receivable) — loading/error states migrated to PageLayout + Skeleton pattern

### Deferred
- FIX B2: `createPlanLimitsMiddleware` — needs Plan schema extension (Central Redesign)
- FIX F4: Not applicable — receivable/payable use inline collapsible filter panel, not separate Card
