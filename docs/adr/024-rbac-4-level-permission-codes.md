# ADR 024: RBAC 4-Level Permission Code Support

## Status
Accepted (2026-03-21)

## Context

The permission system redesign (ADR 023) introduced 243 codes with a `module.resource.action` format (3 levels). However, the `tools` module already needed nested sub-resources (email accounts, task boards, storage files), which naturally map to 4 levels: `tools.email.accounts.access`.

The original validator `isValidPermissionCode()` enforced `parts.length === 3`, blocking 4-level codes. This was fixed during the ADR 023 implementation but lacked formal documentation, a reusable parsing helper, and unit tests.

Additionally, future modules (Sales bids, HR payroll bonuses) will benefit from 4 levels to avoid awkward concatenation hacks like `bid-proposals` instead of `bids.proposals`.

## Decision

### 1. Accept 3 OR 4 levels in `isValidPermissionCode()`

```typescript
export function isValidPermissionCode(code: string): boolean {
  const parts = code.split('.');
  return parts.length >= 3 && parts.length <= 4;
}
```

### 2. Add `parsePermissionCode()` helper (Option B: resource absorbs sub-resource)

For 4-level codes like `tools.email.accounts.access`:
- `module` = `"tools"`
- `resource` = `"email.accounts"` (sub-resource absorbed)
- `action` = `"access"` (always a single verb)

This avoids adding a `subResource` column to the database and keeps `action` clean.

```typescript
export function parsePermissionCode(code: string): ParsedPermissionCode {
  const parts = code.split('.');
  if (parts.length === 3) {
    return { module: parts[0], resource: parts[1], action: parts[2] };
  }
  if (parts.length === 4) {
    return { module: parts[0], resource: `${parts[1]}.${parts[2]}`, action: parts[3] };
  }
  throw new Error(`Invalid permission code: '${code}'`);
}
```

### 3. No database schema changes

The `Permission` model already has `resource VARCHAR(64)` which fits `"email.accounts"` (15 chars). The `seed.ts` and `migrate-permissions.ts` scripts already use dynamic parsing (`parts.slice(1, -1).join('.')`) that handles both 3 and 4 levels.

### 4. Existing permissions are NOT renamed

3-level codes remain valid. 4 levels are only used where it adds semantic value (currently: `tools` module). No data migration needed.

## Alternatives Considered

| Option | Description | Why rejected |
|--------|-------------|--------------|
| Option A: `action = "proposals.access"` | Compound action | Actions should be single verbs |
| Option C: `subResource` column | New DB column | Schema migration + backward-compat for no gain |
| Keep 3 levels, concatenate | `bid-proposals` | Breaks semantic grouping, can't wildcard match |

## Consequences

### Positive
- Natural grouping: `tools.email.*` matches all email permissions
- Future-proof: Sales bids, HR payroll sub-resources supported without hacks
- No breaking changes: all existing 3-level codes unchanged
- No schema migration needed
- `parsePermissionCode()` is a single reusable helper for all consumers

### Negative
- Wildcard `*.*.*` does NOT match 4-level codes (needs `*.*.*.*`) — this is correct behavior since wildcards compare by part count
- Permission matrix UI groups by `backendResources` string which must match the resource prefix (e.g., `tools.email.accounts`) — already working

### Files Changed
- `OpenSea-API/src/constants/rbac/permission-codes.ts` — added `parsePermissionCode()` + `ParsedPermissionCode` interface
- `OpenSea-API/src/constants/rbac/permission-codes.spec.ts` — unit tests for both functions
- `OpenSea-API/docs/adr/024-rbac-4-level-permission-codes.md` — this ADR
- `OpenSea-API/docs/guides/managing-permissions.md` — updated with `parsePermissionCode()` reference
