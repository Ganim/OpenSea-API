# Atlas "Ask Anything" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Atlas from tool-based to "ask anything" — full operational docs, business snapshots, cross-module query tools, and enhanced system prompt, all gated by RBAC.

**Architecture:** Three additive layers on top of existing SendMessageUseCase: (1) DocsRegistry with ~35 markdown guides/troubleshooting per module, (2) BusinessSnapshotService with Redis-cached tenant KPIs, (3) 4 new permission-aware cross-module query tools. Enhanced system prompt instructs AI to teach, troubleshoot, and query data.

**Tech Stack:** TypeScript, Prisma, Redis (ioredis), existing ToolRegistry/ToolExecutor/KnowledgePromptBuilder patterns.

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/services/ai-tools/knowledge/docs-registry.ts` | Load, index, and match operational docs |
| `src/services/ai-tools/knowledge/docs-registry.spec.ts` | Unit tests for DocsRegistry |
| `src/services/ai-tools/knowledge/docs/stock/overview.md` | Stock module overview |
| `src/services/ai-tools/knowledge/docs/stock/guides/*.md` | Stock step-by-step guides (~5 files) |
| `src/services/ai-tools/knowledge/docs/stock/troubleshooting/*.md` | Stock troubleshooting (~3 files) |
| `src/services/ai-tools/knowledge/docs/stock/limitations.md` | Stock known limitations |
| `src/services/ai-tools/knowledge/docs/finance/overview.md` | Finance module overview |
| `src/services/ai-tools/knowledge/docs/finance/guides/*.md` | Finance guides (~5 files) |
| `src/services/ai-tools/knowledge/docs/finance/troubleshooting/*.md` | Finance troubleshooting (~3 files) |
| `src/services/ai-tools/knowledge/docs/finance/limitations.md` | Finance known limitations |
| `src/services/ai-tools/knowledge/docs/hr/overview.md` | HR module overview |
| `src/services/ai-tools/knowledge/docs/hr/guides/*.md` | HR guides (~5 files) |
| `src/services/ai-tools/knowledge/docs/hr/troubleshooting/*.md` | HR troubleshooting (~3 files) |
| `src/services/ai-tools/knowledge/docs/hr/limitations.md` | HR known limitations |
| `src/services/ai-tools/knowledge/docs/sales/overview.md` | Sales module overview |
| `src/services/ai-tools/knowledge/docs/sales/guides/*.md` | Sales guides (~4 files) |
| `src/services/ai-tools/knowledge/docs/sales/troubleshooting/*.md` | Sales troubleshooting (~2 files) |
| `src/services/ai-tools/knowledge/docs/sales/limitations.md` | Sales known limitations |
| `src/services/ai-tools/knowledge/docs/tools/*.md` | Tools module overviews (email, tasks, calendar, storage) |
| `src/services/ai-tools/business-snapshot.service.ts` | Generate and cache tenant business KPIs |
| `src/services/ai-tools/business-snapshot.service.spec.ts` | Unit tests for BusinessSnapshotService |
| `src/services/ai-tools/modules/cross-module-tools.ts` | 4 new tool definitions |
| `src/services/ai-tools/modules/cross-module-handlers.ts` | Handlers for cross-module tools |
| `src/services/ai-tools/modules/cross-module-handlers.spec.ts` | Unit tests for cross-module handlers |
| `src/services/ai-tools/permission-query-builder.ts` | Permission-aware Prisma query builder |
| `src/services/ai-tools/permission-query-builder.spec.ts` | Unit tests for query builder |

### Modified Files

| File | Change |
|------|--------|
| `src/services/ai-tools/knowledge/knowledge-prompt-builder.ts` | Add `buildDocsSection()`, inject docs + snapshot into prompt |
| `src/services/ai-tools/make-tool-registry.ts` | Register cross-module tools |
| `src/services/ai-tools/tool-use-case-factory.ts` | Register cross-module handlers |
| `src/use-cases/ai/conversations/send-message.ts` | Import DocsRegistry + BusinessSnapshotService, enhanced system prompt |
| `src/server.ts` | Add snapshot refresh cron job |
| `src/services/ai-tools/index.ts` | Export new modules |

---

## Task 1: DocsRegistry — Core Infrastructure

**Files:**
- Create: `src/services/ai-tools/knowledge/docs-registry.ts`
- Create: `src/services/ai-tools/knowledge/docs-registry.spec.ts`

- [ ] **Step 1: Write DocsRegistry interface and class**

```typescript
// src/services/ai-tools/knowledge/docs-registry.ts
export interface DocEntry {
  module: string;
  feature: string;
  type: 'overview' | 'guide' | 'troubleshooting' | 'limitation';
  keywords: string[];
  requiredPermissions: string[];
  navPath?: string;
  title: string;
  content: string;
}

export class DocsRegistry {
  private docs: DocEntry[] = [];

  register(doc: DocEntry): void {
    this.docs.push(doc);
  }

  registerMany(docs: DocEntry[]): void {
    this.docs.push(...docs);
  }

  /**
   * Find docs relevant to user message, filtered by permissions.
   * Returns top N docs sorted by relevance score.
   */
  findRelevantDocs(
    message: string,
    userPermissions: string[],
    limit = 3,
  ): DocEntry[] {
    const permSet = new Set(userPermissions);
    const lowerMessage = message.toLowerCase();

    const scored = this.docs
      .filter((doc) =>
        doc.requiredPermissions.every((p) => permSet.has(p)),
      )
      .map((doc) => ({ doc, score: this.scoreDoc(doc, lowerMessage) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ doc }) => doc);
  }

  getDocsByModule(module: string): DocEntry[] {
    return this.docs.filter((d) => d.module === module);
  }

  getAllDocs(): DocEntry[] {
    return [...this.docs];
  }

  private scoreDoc(doc: DocEntry, lowerMessage: string): number {
    let score = 0;

    // Title match
    if (lowerMessage.includes(doc.title.toLowerCase())) score += 15;

    // Keyword matches
    for (const kw of doc.keywords) {
      if (lowerMessage.includes(kw.toLowerCase())) score += 5;
    }

    // Feature name match
    if (lowerMessage.includes(doc.feature.toLowerCase())) score += 8;

    // Module name match
    if (lowerMessage.includes(doc.module.toLowerCase())) score += 3;

    // Boost troubleshooting if message contains problem words
    const problemWords = ['erro', 'error', 'problema', 'não consigo', 'nao consigo', 'falha', 'bug', 'ajuda', 'como', 'por que', 'porque'];
    const hasProblem = problemWords.some((w) => lowerMessage.includes(w));
    if (hasProblem && doc.type === 'troubleshooting') score += 10;

    // Boost guides if message contains "how to" words
    const howToWords = ['como', 'passo', 'criar', 'cadastrar', 'configurar', 'fazer', 'adicionar', 'registrar'];
    const hasHowTo = howToWords.some((w) => lowerMessage.includes(w));
    if (hasHowTo && doc.type === 'guide') score += 10;

    return score;
  }
}
```

- [ ] **Step 2: Write unit tests for DocsRegistry**

```typescript
// src/services/ai-tools/knowledge/docs-registry.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DocsRegistry, type DocEntry } from './docs-registry';

const mockDoc = (overrides: Partial<DocEntry> = {}): DocEntry => ({
  module: 'stock',
  feature: 'create-product',
  type: 'guide',
  keywords: ['produto', 'criar', 'cadastrar'],
  requiredPermissions: ['stock.products.register'],
  navPath: 'Menu > Estoque > Produtos > Novo',
  title: 'Como Criar um Produto',
  content: 'Passo a passo para criar um produto...',
  ...overrides,
});

describe('DocsRegistry', () => {
  let registry: DocsRegistry;

  beforeEach(() => {
    registry = new DocsRegistry();
  });

  it('should register and retrieve docs', () => {
    registry.register(mockDoc());
    expect(registry.getAllDocs()).toHaveLength(1);
  });

  it('should filter by permissions', () => {
    registry.register(mockDoc());
    registry.register(mockDoc({
      module: 'finance',
      requiredPermissions: ['finance.entries.access'],
      keywords: ['financeiro'],
    }));

    const results = registry.findRelevantDocs(
      'como criar um produto',
      ['stock.products.register'], // no finance permission
    );

    expect(results.every((d) => d.module === 'stock')).toBe(true);
  });

  it('should score troubleshooting higher for problem messages', () => {
    registry.register(mockDoc({ type: 'guide', keywords: ['produto'] }));
    registry.register(mockDoc({
      type: 'troubleshooting',
      feature: 'product-not-showing',
      title: 'Produto nao aparece',
      keywords: ['produto', 'nao aparece'],
    }));

    const results = registry.findRelevantDocs(
      'meu produto nao aparece, o que esta errado?',
      ['stock.products.register'],
    );

    expect(results[0].type).toBe('troubleshooting');
  });

  it('should score guides higher for how-to messages', () => {
    registry.register(mockDoc({ type: 'troubleshooting', keywords: ['produto'] }));
    registry.register(mockDoc({ type: 'guide', keywords: ['produto', 'criar'] }));

    const results = registry.findRelevantDocs(
      'como criar um produto no sistema?',
      ['stock.products.register'],
    );

    expect(results[0].type).toBe('guide');
  });

  it('should return empty for no matching permissions', () => {
    registry.register(mockDoc());
    const results = registry.findRelevantDocs('criar produto', []);
    expect(results).toHaveLength(0);
  });

  it('should limit results', () => {
    for (let i = 0; i < 10; i++) {
      registry.register(mockDoc({ feature: `feat-${i}`, keywords: ['produto'] }));
    }
    const results = registry.findRelevantDocs('produto', ['stock.products.register'], 3);
    expect(results).toHaveLength(3);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run src/services/ai-tools/knowledge/docs-registry.spec.ts`
Expected: All 6 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/ai-tools/knowledge/docs-registry.ts src/services/ai-tools/knowledge/docs-registry.spec.ts
git commit -m "feat(ai): add DocsRegistry for operational documentation matching"
```

---

## Task 2: Knowledge Docs — Stock Module

**Files:**
- Create: `src/services/ai-tools/knowledge/docs/stock/overview.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/guides/create-product.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/guides/manage-variants.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/guides/stock-movement.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/guides/warehouse-setup.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/guides/inventory-labels.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/troubleshooting/product-not-showing.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/troubleshooting/stock-negative.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/troubleshooting/movement-errors.md`
- Create: `src/services/ai-tools/knowledge/docs/stock/limitations.md`

Each doc uses this frontmatter format to be parsed by DocsRegistry:

```markdown
---
module: stock
feature: create-product
type: guide
keywords: [produto, criar, cadastrar, novo, adicionar, registrar]
requires_permissions: [stock.products.register]
nav_path: Menu > Estoque > Produtos > Novo Produto
title: Como Criar um Produto
---
```

- [ ] **Step 1: Write all Stock docs** by reading actual page/controller code to ensure accuracy
- [ ] **Step 2: Verify all docs have correct frontmatter**
- [ ] **Step 3: Commit**

```bash
git add src/services/ai-tools/knowledge/docs/stock/
git commit -m "feat(ai): add stock module operational docs (10 files)"
```

---

## Task 3: Knowledge Docs — Finance Module

**Files:**
- Create: `src/services/ai-tools/knowledge/docs/finance/overview.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/guides/create-entry.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/guides/manage-bank-accounts.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/guides/cost-centers.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/guides/pix-operations.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/guides/boleto-generation.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/troubleshooting/entry-not-reconciling.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/troubleshooting/overdue-entries.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/troubleshooting/payment-errors.md`
- Create: `src/services/ai-tools/knowledge/docs/finance/limitations.md`

- [ ] **Step 1: Write all Finance docs** by reading actual code
- [ ] **Step 2: Commit**

```bash
git add src/services/ai-tools/knowledge/docs/finance/
git commit -m "feat(ai): add finance module operational docs (10 files)"
```

---

## Task 4: Knowledge Docs — HR Module

**Files:**
- Create: `src/services/ai-tools/knowledge/docs/hr/overview.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/guides/register-employee.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/guides/manage-departments.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/guides/work-schedules.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/guides/vacation-management.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/guides/payroll-basics.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/troubleshooting/schedule-conflicts.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/troubleshooting/missing-employee.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/troubleshooting/vacation-errors.md`
- Create: `src/services/ai-tools/knowledge/docs/hr/limitations.md`

- [ ] **Step 1: Write all HR docs** by reading actual code
- [ ] **Step 2: Commit**

```bash
git add src/services/ai-tools/knowledge/docs/hr/
git commit -m "feat(ai): add HR module operational docs (10 files)"
```

---

## Task 5: Knowledge Docs — Sales Module + Tools

**Files:**
- Create: `src/services/ai-tools/knowledge/docs/sales/overview.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/guides/create-customer.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/guides/create-order.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/guides/manage-promotions.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/guides/reservation-flow.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/troubleshooting/order-stuck.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/troubleshooting/price-mismatch.md`
- Create: `src/services/ai-tools/knowledge/docs/sales/limitations.md`
- Create: `src/services/ai-tools/knowledge/docs/tools/email-overview.md`
- Create: `src/services/ai-tools/knowledge/docs/tools/tasks-overview.md`
- Create: `src/services/ai-tools/knowledge/docs/tools/calendar-overview.md`
- Create: `src/services/ai-tools/knowledge/docs/tools/storage-overview.md`

- [ ] **Step 1: Write all Sales + Tools docs** by reading actual code
- [ ] **Step 2: Commit**

```bash
git add src/services/ai-tools/knowledge/docs/sales/ src/services/ai-tools/knowledge/docs/tools/
git commit -m "feat(ai): add sales + tools module operational docs (12 files)"
```

---

## Task 6: DocsRegistry Loader + Factory

**Files:**
- Create: `src/services/ai-tools/knowledge/make-docs-registry.ts`
- Modify: `src/services/ai-tools/knowledge/docs-registry.ts` (add static loader)

- [ ] **Step 1: Add markdown frontmatter parser to DocsRegistry**

Add a static method that reads all docs from embedded data (not filesystem at runtime — we compile docs into a TypeScript module for portability):

```typescript
// src/services/ai-tools/knowledge/make-docs-registry.ts
import { DocsRegistry } from './docs-registry';
import { stockDocs } from './docs/stock';
import { financeDocs } from './docs/finance';
import { hrDocs } from './docs/hr';
import { salesDocs } from './docs/sales';
import { toolsDocs } from './docs/tools';

let cached: DocsRegistry | null = null;

export function makeDocsRegistry(): DocsRegistry {
  if (cached) return cached;
  const registry = new DocsRegistry();
  registry.registerMany([
    ...stockDocs,
    ...financeDocs,
    ...hrDocs,
    ...salesDocs,
    ...toolsDocs,
  ]);
  cached = registry;
  return registry;
}
```

Each module docs folder gets an `index.ts` that exports `DocEntry[]` from the markdown content (embedded as strings).

- [ ] **Step 2: Create index.ts barrel files for each module docs folder**

Example for stock:
```typescript
// src/services/ai-tools/knowledge/docs/stock/index.ts
import type { DocEntry } from '../../docs-registry';

export const stockDocs: DocEntry[] = [
  {
    module: 'stock',
    feature: 'overview',
    type: 'overview',
    keywords: ['estoque', 'stock', 'modulo', 'visao geral'],
    requiredPermissions: ['stock.products.access'],
    title: 'Visao Geral do Modulo de Estoque',
    content: `...`,  // Full markdown content inline
  },
  // ... other docs
];
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ai-tools/knowledge/make-docs-registry.ts src/services/ai-tools/knowledge/docs/
git commit -m "feat(ai): add DocsRegistry factory with all module doc loaders"
```

---

## Task 7: BusinessSnapshotService

**Files:**
- Create: `src/services/ai-tools/business-snapshot.service.ts`
- Create: `src/services/ai-tools/business-snapshot.service.spec.ts`

- [ ] **Step 1: Write BusinessSnapshotService**

```typescript
// src/services/ai-tools/business-snapshot.service.ts
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export interface ModuleSnapshot {
  stock?: { totalProducts: number; activeProducts: number; lowStockCount: number; totalCategories: number; recentMovements: number };
  finance?: { totalReceivable: number; totalPayable: number; overdueCount: number; monthRevenue: number; monthExpenses: number };
  hr?: { totalEmployees: number; activeCount: number; onVacation: number; departmentCount: number };
  sales?: { totalOrders: number; monthOrders: number; monthRevenue: number; openOrders: number; totalCustomers: number };
}

export interface TenantSnapshot {
  tenantId: string;
  generatedAt: string;
  modules: ModuleSnapshot;
}

const CACHE_KEY_PREFIX = 'atlas:snapshot:';
const CACHE_TTL_SECONDS = 3600; // 1 hour

export class BusinessSnapshotService {
  async generate(tenantId: string): Promise<TenantSnapshot> {
    const [stock, finance, hr, sales] = await Promise.allSettled([
      this.generateStockSnapshot(tenantId),
      this.generateFinanceSnapshot(tenantId),
      this.generateHrSnapshot(tenantId),
      this.generateSalesSnapshot(tenantId),
    ]);

    const snapshot: TenantSnapshot = {
      tenantId,
      generatedAt: new Date().toISOString(),
      modules: {
        stock: stock.status === 'fulfilled' ? stock.value : undefined,
        finance: finance.status === 'fulfilled' ? finance.value : undefined,
        hr: hr.status === 'fulfilled' ? hr.value : undefined,
        sales: sales.status === 'fulfilled' ? sales.value : undefined,
      },
    };

    // Cache in Redis
    await redis.set(
      `${CACHE_KEY_PREFIX}${tenantId}`,
      JSON.stringify(snapshot),
      'EX',
      CACHE_TTL_SECONDS,
    );

    return snapshot;
  }

  async getCached(tenantId: string): Promise<TenantSnapshot | null> {
    const data = await redis.get(`${CACHE_KEY_PREFIX}${tenantId}`);
    return data ? JSON.parse(data) : null;
  }

  async getOrGenerate(tenantId: string): Promise<TenantSnapshot> {
    const cached = await this.getCached(tenantId);
    if (cached) return cached;
    return this.generate(tenantId);
  }

  async invalidate(tenantId: string): Promise<void> {
    await redis.del(`${CACHE_KEY_PREFIX}${tenantId}`);
  }

  /** Filter snapshot to only include modules user has permission for */
  filterByPermissions(snapshot: TenantSnapshot, permissions: string[]): TenantSnapshot {
    const permSet = new Set(permissions);
    const hasModule = (prefix: string) =>
      [...permSet].some((p) => p.startsWith(prefix));

    return {
      ...snapshot,
      modules: {
        stock: hasModule('stock.') ? snapshot.modules.stock : undefined,
        finance: hasModule('finance.') ? snapshot.modules.finance : undefined,
        hr: hasModule('hr.') ? snapshot.modules.hr : undefined,
        sales: hasModule('sales.') ? snapshot.modules.sales : undefined,
      },
    };
  }

  // --- Private generators per module ---

  private async generateStockSnapshot(tenantId: string) { /* Prisma queries */ }
  private async generateFinanceSnapshot(tenantId: string) { /* Prisma queries */ }
  private async generateHrSnapshot(tenantId: string) { /* Prisma queries */ }
  private async generateSalesSnapshot(tenantId: string) { /* Prisma queries */ }
}
```

- [ ] **Step 2: Implement each module snapshot generator with real Prisma queries**

Read the Prisma schema to determine exact model names and fields for count/sum queries.

- [ ] **Step 3: Write unit tests**

Test permission filtering, caching logic (mock Redis), snapshot structure.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/ai-tools/business-snapshot.service.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add src/services/ai-tools/business-snapshot.service.ts src/services/ai-tools/business-snapshot.service.spec.ts
git commit -m "feat(ai): add BusinessSnapshotService with Redis caching and RBAC filtering"
```

---

## Task 8: PermissionAwareQueryBuilder

**Files:**
- Create: `src/services/ai-tools/permission-query-builder.ts`
- Create: `src/services/ai-tools/permission-query-builder.spec.ts`

- [ ] **Step 1: Write PermissionAwareQueryBuilder**

Handles 3 query types:
1. `search_entities` — full-text search across models filtered by permission
2. `get_business_kpis` — reads from snapshot + optional real-time calculations
3. `cross_module_query` — joins between 2 modules with permission validation

Key design:
- Maps module + entity to Prisma model name
- Always applies `tenantId` filter
- Validates ALL required permissions before executing
- Returns structured results, never raw DB rows
- Returns `{ success: false, missingPermissions: [...] }` on permission failure

- [ ] **Step 2: Write unit tests for permission validation logic**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```bash
git add src/services/ai-tools/permission-query-builder.ts src/services/ai-tools/permission-query-builder.spec.ts
git commit -m "feat(ai): add PermissionAwareQueryBuilder with RBAC enforcement"
```

---

## Task 9: Cross-Module Tools + Handlers

**Files:**
- Create: `src/services/ai-tools/modules/cross-module-tools.ts`
- Create: `src/services/ai-tools/modules/cross-module-handlers.ts`
- Create: `src/services/ai-tools/modules/cross-module-handlers.spec.ts`

- [ ] **Step 1: Define 4 tool definitions in cross-module-tools.ts**

Following exact pattern from `stock-tools.ts`:
- `atlas_search_entities` — query category, permission `system.ai.access`
- `atlas_get_business_kpis` — query category, permission `system.ai.access`
- `atlas_cross_module_query` — query category, permission `system.ai.access`
- `atlas_refresh_snapshot` — action category, permission `system.ai.access`

Note: These tools use `system.ai.access` as base permission, but the handlers internally validate module-specific permissions via PermissionAwareQueryBuilder. This way the tools show up for any AI user but data access is still gated.

- [ ] **Step 2: Implement handlers in cross-module-handlers.ts**

Following exact pattern from `stock-handlers.ts`:
```typescript
export function getCrossModuleHandlers(): Record<string, ToolHandler> {
  return {
    atlas_search_entities: { async execute(args, context) { ... } },
    atlas_get_business_kpis: { async execute(args, context) { ... } },
    atlas_cross_module_query: { async execute(args, context) { ... } },
    atlas_refresh_snapshot: { async execute(args, context) { ... } },
  };
}
```

Each handler uses `PermissionAwareQueryBuilder` internally.

- [ ] **Step 3: Write unit tests for handlers (mock Prisma + Redis)**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit**

```bash
git add src/services/ai-tools/modules/cross-module-tools.ts src/services/ai-tools/modules/cross-module-handlers.ts src/services/ai-tools/modules/cross-module-handlers.spec.ts
git commit -m "feat(ai): add 4 cross-module query tools with RBAC-enforced handlers"
```

---

## Task 10: Register New Tools + Handlers

**Files:**
- Modify: `src/services/ai-tools/make-tool-registry.ts`
- Modify: `src/services/ai-tools/tool-use-case-factory.ts`

- [ ] **Step 1: Add cross-module tools to registry**

```typescript
// make-tool-registry.ts — add:
import { getCrossModuleTools } from './modules/cross-module-tools';
// Inside makeToolRegistry():
registry.registerMany(getCrossModuleTools());
```

- [ ] **Step 2: Add cross-module handlers to factory**

```typescript
// tool-use-case-factory.ts — add:
import { getCrossModuleHandlers } from './modules/cross-module-handlers';
// Inside constructor:
for (const [name, handler] of Object.entries(getCrossModuleHandlers())) {
  this.handlers.set(name, handler);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ai-tools/make-tool-registry.ts src/services/ai-tools/tool-use-case-factory.ts
git commit -m "feat(ai): register cross-module tools and handlers in factory"
```

---

## Task 11: Enhanced System Prompt + KnowledgePromptBuilder Integration

**Files:**
- Modify: `src/use-cases/ai/conversations/send-message.ts`
- Modify: `src/services/ai-tools/knowledge/knowledge-prompt-builder.ts`

- [ ] **Step 1: Add `buildDocsSection()` to KnowledgePromptBuilder**

New method that formats DocEntry[] into a compact prompt section:
```typescript
buildDocsSection(docs: DocEntry[]): string {
  if (docs.length === 0) return '';
  const sections = docs.map((d) => {
    const nav = d.navPath ? `\nNavegacao: ${d.navPath}` : '';
    return `#### ${d.title}${nav}\n${d.content}`;
  });
  return `### Documentacao Relevante\n\n${sections.join('\n\n')}`;
}
```

Add `buildSnapshotSection()`:
```typescript
buildSnapshotSection(snapshot: TenantSnapshot): string {
  // Format snapshot KPIs into compact readable text
}
```

- [ ] **Step 2: Enhance `buildContextualPrompt()` to accept docs and snapshot**

Add optional params:
```typescript
buildContextualPrompt(
  registry: KnowledgeRegistry,
  userMessage: string,
  userPermissions: string[],
  options?: {
    docs?: DocEntry[];
    snapshot?: TenantSnapshot;
  },
): string
```

- [ ] **Step 3: Replace system prompt in send-message.ts**

Replace the current `systemPromptParts` (lines 164-171) with the enhanced version that includes:
- Full capability description
- Permission rules (CRITICAL)
- Guide mode instructions
- Troubleshooting mode instructions
- Data query instructions

Also add DocsRegistry and BusinessSnapshotService calls:
```typescript
// After line 178 (knowledgePrompt):
const docsRegistry = makeDocsRegistry();
const relevantDocs = docsRegistry.findRelevantDocs(
  request.content,
  request.userPermissions ?? [],
);

const snapshotService = new BusinessSnapshotService();
const snapshot = await snapshotService.getOrGenerate(request.tenantId);
const filteredSnapshot = snapshotService.filterByPermissions(
  snapshot,
  request.userPermissions ?? [],
);
```

Pass these into `buildContextualPrompt()`.

- [ ] **Step 4: Commit**

```bash
git add src/use-cases/ai/conversations/send-message.ts src/services/ai-tools/knowledge/knowledge-prompt-builder.ts
git commit -m "feat(ai): enhanced system prompt with docs, snapshot, and ask-anything instructions"
```

---

## Task 12: Snapshot Cron Job in server.ts

**Files:**
- Modify: `src/server.ts`

- [ ] **Step 1: Add snapshot refresh interval**

Following existing pattern (workflow scheduler, insight scheduler):
```typescript
import { BusinessSnapshotService } from './services/ai-tools/business-snapshot.service';

// After line 222 (financeScheduler.start()):
// Start business snapshot refresh (every 1 hour for active tenants)
const snapshotService = new BusinessSnapshotService();
const snapshotInterval = setInterval(async () => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    for (const tenant of tenants) {
      await snapshotService.generate(tenant.id);
    }
  } catch (err) {
    console.error('[snapshot] Refresh failed:', err);
  }
}, 60 * 60 * 1000); // 1 hour

// In shutdown handler, clear interval:
clearInterval(snapshotInterval);
```

- [ ] **Step 2: Commit**

```bash
git add src/server.ts
git commit -m "feat(ai): add hourly business snapshot refresh cron"
```

---

## Task 13: Update Barrel Exports

**Files:**
- Modify: `src/services/ai-tools/index.ts`

- [ ] **Step 1: Export new modules from barrel**

```typescript
export { DocsRegistry } from './knowledge/docs-registry';
export { makeDocsRegistry } from './knowledge/make-docs-registry';
export { BusinessSnapshotService } from './business-snapshot.service';
export { PermissionAwareQueryBuilder } from './permission-query-builder';
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai-tools/index.ts
git commit -m "chore(ai): update barrel exports for new ask-anything modules"
```

---

## Execution Order

Tasks 1-6 (DocsRegistry + docs) are independent from Tasks 7-8 (snapshot + query builder).
Task 9 depends on Task 8.
Task 10 depends on Task 9.
Task 11 depends on Tasks 1-10.
Task 12-13 are independent post-integration.

**Parallel waves:**
- Wave 1: Tasks 1, 7, 8 (core infrastructure — in parallel)
- Wave 2: Tasks 2, 3, 4, 5 (docs content — in parallel)
- Wave 3: Task 6 (doc loader — needs wave 2)
- Wave 4: Task 9 (cross-module tools — needs wave 1)
- Wave 5: Task 10 (registration — needs wave 4)
- Wave 6: Task 11 (integration — needs waves 3+5)
- Wave 7: Tasks 12, 13 (cron + exports — in parallel, needs wave 6)
