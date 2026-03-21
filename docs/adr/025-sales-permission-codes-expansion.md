# ADR 025: Sales Module Permission Codes Expansion

## Status
Accepted (2026-03-21)

## Context

The Sales module had only 3 resources (customers, promotions, orders) with 19 permission codes using the standard 10 actions. The planned Sales ecosystem requires CRM, pricing, POS, cashier, bids, catalogs, marketplaces, and analytics — each with domain-specific actions that don't map to standard CRUD verbs.

The `Permission.action` column is `VarChar(64)` (not an enum), so new actions can be added freely without schema migration.

## Decision

### 1. Expand Sales from 3 to 30 resources with 117 codes

| Category | Resources |
|----------|-----------|
| CRM | customers, contacts, deals, pipelines, activities, conversations, workflows, forms, proposals, msg-templates |
| Pricing | price-tables, discounts, coupons, campaigns, combos, promotions |
| Orders | orders (expanded), quotes, returns, commissions |
| PDV & Caixa | pos, cashier |
| Licitações | bids, bid-proposals, bid-bot, bid-contracts, bid-documents |
| Marketing | catalogs, content, marketplaces |
| Analytics | analytics |

### 2. Introduce 21 domain-specific actions

| Action | Use case | Why standard actions don't fit |
|--------|----------|-------------------------------|
| confirm | Confirm order (triggers billing) | Irreversible, unlike `modify` |
| approve | Approve order/return | Workflow transition, not edit |
| cancel | Void confirmed record | Record persists, unlike `remove` |
| reassign | Transfer ownership | Specific to reassignment |
| reply | Respond in conversation | Not creating a new record |
| execute | Trigger workflow | Runs process, doesn't edit |
| activate | Toggle active state | State toggle only |
| send | Send to external party | Sends to person, not file download |
| convert | Transform entity (quote→order) | Unique transformation |
| sell | Perform POS sale | Core POS action |
| open/close | Cashier session | Domain-specific |
| withdraw/supply | Cash operations (sangria/suprimento) | Financial operations |
| receive | Receive payment | Specifically receiving money |
| verify | Audit/blind count | Verification action |
| override | Override system calculation | Elevated action, PIN-required |
| publish | Make publicly available | Public vs specific users |
| generate | Generate via AI | AI-specific |
| query | Ask AI | AI-specific |
| sync | Sync with external | Marketplace-specific |

### 3. Add AI Tool permissions (4 codes)

`tools.ai.access`, `tools.ai.query`, `tools.ai.execute`, `tools.ai.admin`

### 4. Add CRM basic access to DEFAULT_USER_PERMISSIONS

All tenant users get: customers/contacts/deals (view), activities (view+create), conversations (view+reply), analytics (view, own only), AI (access+query).

### 5. Permission matrix UI handles standard actions only

Domain-specific actions (confirm, approve, sell, etc.) are not displayed as columns in the matrix table. They appear in the "unmapped permissions" section of the permission group editor, where admins can still assign them. A future matrix UI update may add domain-specific action columns per tab.

## Consequences

### Positive
- Complete permission coverage for the full Sales ecosystem
- Domain-specific actions are self-documenting
- No schema migration needed (`VarChar(64)` accommodates all actions)
- Default user permissions enable basic CRM for all users out of the box
- Backward compatible — existing 3-resource Sales codes unchanged

### Negative
- 21 domain-specific actions not visible in matrix table columns (handled via unmapped section)
- Total code count increased from 243 to 363
- Frontend `salesPerm()` helper needed alongside standard `perm()` to support extra action types

### Files Changed
- `OpenSea-API/src/constants/rbac/permission-codes.ts` — expanded SALES (30 resources), added TOOLS.AI, added DEFAULT_USER_PERMISSIONS for CRM/AI
- `OpenSea-APP/src/config/rbac/permission-codes.ts` — mirrored backend, added `salesPerm()` helper
- `OpenSea-APP/.../permission-matrix-config.ts` — added 31 new resources to Sales tab + AI to Tools tab
- `CLAUDE.md` — updated total count and documented domain-specific actions
