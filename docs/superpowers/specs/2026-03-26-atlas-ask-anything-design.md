# Atlas "Ask Anything" — Design Spec

## Goal

Evolve Atlas from a tool-based assistant to a full "ask anything" assistant that can answer any question about the OpenSea ERP ecosystem, teach users step-by-step, troubleshoot problems, and query real business data — all gated by RBAC permissions.

## Decision Record

- **Cross-module permission denial**: Inform user which permissions are missing (option B)
- **Business snapshot**: Cached periodically (1h), user can force refresh
- **Query tools**: Generic tools (A) + secure query builder (C lite)
- **Knowledge docs**: Full operational documentation per module for guides and troubleshooting

## Architecture

Three new layers plugged into the existing `SendMessageUseCase`:

```
User message
    ↓
[Enhanced System Prompt]        ← personality + "ask anything" instructions
    ↓
[Knowledge Docs Layer]          ← operational docs (guides, troubleshooting, limitations)
    ↓
[Business Snapshot]             ← cached KPIs per tenant (Redis, 1h refresh)
    ↓
[Permission-Aware Query Tools]  ← 4 generic tools with secure query builder
    ↓
[Cross-Module Permission Gate]  ← informs missing permissions
    ↓
AI responds conversationally or executes tools
```

No changes to existing tool calling flow. Additive only.

## 1. Knowledge Docs Layer

### Structure

```
src/services/ai-tools/knowledge/docs/
  stock/
    overview.md
    guides/
      create-product.md
      manage-variants.md
      stock-movement.md
      inventory-labels.md
      warehouse-setup.md
    troubleshooting/
      product-not-showing.md
      stock-negative.md
      movement-errors.md
    limitations.md
  finance/
    overview.md
    guides/
      create-entry.md
      manage-bank-accounts.md
      cost-centers.md
      pix-operations.md
      boleto-generation.md
    troubleshooting/
      entry-not-reconciling.md
      overdue-entries.md
    limitations.md
  hr/
    overview.md
    guides/
      register-employee.md
      manage-departments.md
      work-schedules.md
      vacation-management.md
      payroll-basics.md
    troubleshooting/
      schedule-conflicts.md
      missing-employee.md
    limitations.md
  sales/
    overview.md
    guides/
      create-customer.md
      create-order.md
      manage-promotions.md
      reservation-flow.md
    troubleshooting/
      order-stuck.md
      price-mismatch.md
    limitations.md
  tools/
    email/overview.md
    tasks/overview.md
    calendar/overview.md
    storage/overview.md
```

### Doc Format

Each doc is max ~500 words, structured:

```markdown
---
module: stock
feature: create-product
keywords: [produto, criar, cadastrar, novo, adicionar]
requires_permissions: [stock.products.register]
nav_path: Menu > Estoque > Produtos > Novo Produto
---

# Como Criar um Produto

## Pre-requisitos
- Ter pelo menos 1 categoria cadastrada
- Ter pelo menos 1 template (opcional, mas recomendado)

## Passo a Passo
1. Acesse **Menu > Estoque > Produtos**
2. Clique no botao **"Novo Produto"** no canto superior direito
3. ...

## Erros Comuns
- **"Nome ja existe"**: O sistema nao permite produtos com nome duplicado
- **"Categoria obrigatoria"**: Selecione uma categoria antes de salvar

## Dicas
- Use templates para preencher campos automaticamente
```

### Loading & Matching

New class `DocsRegistry`:
- Loads all .md files on server boot (parsed frontmatter + body)
- Indexes by module, feature, keywords
- `findRelevantDocs(message, permissions)` → returns top 2-3 docs
- Keyword matching: same approach as `KnowledgeRegistry.getModulesByIntent()`
- Permission gating: only returns docs where user has ALL `requires_permissions`

### Integration

`KnowledgePromptBuilder.buildContextualPrompt()` enhanced:
- After module knowledge, appends relevant docs content
- Budget: max 3 docs, max 2000 chars total for docs section
- Docs are appended as `### Documentacao Relevante\n{doc1}\n{doc2}`

## 2. Business Snapshot Service

### Interface

```typescript
interface ModuleSnapshot {
  stock?: {
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    totalCategories: number;
    recentMovements: number; // last 7 days
  };
  finance?: {
    totalReceivable: number;
    totalPayable: number;
    overdueCount: number;
    monthRevenue: number;
    monthExpenses: number;
    cashBalance: number;
  };
  hr?: {
    totalEmployees: number;
    activeCount: number;
    onVacation: number;
    departmentCount: number;
  };
  sales?: {
    totalOrders: number;
    monthOrders: number;
    monthRevenue: number;
    openOrders: number;
    totalCustomers: number;
  };
}

interface TenantSnapshot {
  tenantId: string;
  generatedAt: Date;
  modules: ModuleSnapshot;
}
```

### Implementation

- `BusinessSnapshotService` class
- `generate(tenantId, userPermissions)` → queries Prisma for each permitted module
- Cache: Redis key `atlas:snapshot:{tenantId}`, TTL 1h
- Cron: BullMQ job every 1h iterating active tenants
- Force refresh via `refresh_business_snapshot` tool

### Permission Filtering

Snapshot is generated with ALL modules for the tenant, but when injected into the prompt, only modules the user has permission for are included.

## 3. Permission-Aware Query Tools

### 3.1 `search_entities`

```typescript
{
  name: 'search_entities',
  description: 'Busca textual em entidades do sistema',
  parameters: {
    query: string,        // texto de busca
    modules: string[],    // ['stock', 'finance', 'hr', 'sales']
    entityTypes?: string[], // ['products', 'employees', ...]
    limit?: number,       // default 10
  }
}
```

Before execution: validates user has `{module}.{entity}.access` for each requested module/entity. Returns permission error for unauthorized modules.

### 3.2 `get_business_kpis`

```typescript
{
  name: 'get_business_kpis',
  description: 'Obtem KPIs e metricas do negocio',
  parameters: {
    modules: string[],     // which modules to get KPIs for
    period?: string,       // 'today' | 'week' | 'month' | 'quarter' | 'year'
    compareWithPrevious?: boolean,
  }
}
```

Returns the cached snapshot data, filtered by permission. If `compareWithPrevious`, calculates delta.

### 3.3 `cross_module_query`

```typescript
{
  name: 'cross_module_query',
  description: 'Consulta cruzando dados de 2+ modulos',
  parameters: {
    primaryModule: string,
    secondaryModule: string,
    queryType: 'top_by_metric' | 'correlation' | 'breakdown',
    metric: string,        // e.g. 'revenue', 'quantity', 'cost'
    groupBy?: string,      // e.g. 'product', 'employee', 'department'
    limit?: number,
    period?: string,
  }
}
```

Validates permissions for ALL modules involved. If any missing, returns which permissions are needed.

### 3.4 `refresh_business_snapshot`

```typescript
{
  name: 'refresh_business_snapshot',
  description: 'Forca atualizacao dos dados do painel de negocios',
  parameters: {}
}
```

Clears Redis cache and regenerates snapshot for the tenant.

### Secure Query Builder

`PermissionAwareQueryBuilder` class:
- Receives typed parameters (never raw SQL/Prisma)
- Maps queryType + modules + metric to predefined Prisma queries
- Always applies `tenantId` filter
- Always validates permissions before execution
- Returns structured results (never raw DB rows)

## 4. Enhanced System Prompt

Replace current generic prompt with comprehensive instructions. See `buildEnhancedSystemPrompt()` in implementation.

Key additions:
- Explicit "ask anything" capability description
- Permission rules (CRITICAL section)
- Guide mode instructions ("como fazer X")
- Troubleshooting mode instructions ("X nao funciona")
- Data query instructions ("quanto/quantos/qual")
- Formatting guidelines (nav paths, step numbers, markdown)

## 5. Changes to Existing Code

### send-message.ts

Minimal changes:
- Import and use `DocsRegistry` for doc matching
- Import and use `BusinessSnapshotService` for snapshot injection
- Enhanced system prompt builder
- Add 4 new tools to `ToolRegistry`

### tool-registry.ts

- Register 4 new tools in the registry
- New handler files for each tool

### knowledge-prompt-builder.ts

- New method `buildDocsSection(docs)` for formatting docs
- Enhanced `buildContextualPrompt()` to include docs + snapshot

## 6. Files to Create

```
# New files
src/services/ai-tools/knowledge/docs-registry.ts
src/services/ai-tools/knowledge/docs/**/*.md          (~30-40 docs)
src/services/ai-tools/business-snapshot.service.ts
src/services/ai-tools/permission-query-builder.ts
src/services/ai-tools/modules/cross-module-tools.ts
src/services/ai-tools/modules/cross-module-handlers.ts

# Modified files
src/services/ai-tools/knowledge/knowledge-prompt-builder.ts
src/services/ai-tools/tool-registry.ts
src/use-cases/ai/conversations/send-message.ts
src/server.ts                                          (snapshot cron)
```

## 7. Testing

- Unit tests for DocsRegistry (loading, matching, permission filtering)
- Unit tests for BusinessSnapshotService (generation, caching)
- Unit tests for PermissionAwareQueryBuilder (permission validation, query execution)
- Unit tests for cross-module tools (handlers, permission gate)
- Integration test for enhanced send-message flow
