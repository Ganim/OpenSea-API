# AI Function Calling Engine + Stock Agent — Design Spec

## Overview

Transform the Atlas AI assistant from a text-only chatbot into an **agentic system** that can query real data and execute actions in the Stock module. The AI uses function calling (tool_use) to interact with existing use-cases, respecting RBAC permissions, requiring confirmation for write operations, and maintaining undo capability via the audit system.

**Current state**: `SendMessageUseCase` sends plain text to AI providers and returns plain text. The AI has no access to real data and hallucinates answers.

**Target state**: AI providers receive tool definitions filtered by user permissions. An agentic loop allows multi-step reasoning (query → analyze → act). Write operations require user confirmation. All actions are traceable via audit logs.

## Architecture

### System Flow

```
User sends message
       ↓
SendMessageUseCase (modified)
       ↓
┌─── Build tool definitions ───┐
│  ToolRegistry.getTools()     │
│  Filter by user permissions  │
│  (no permission = tool       │
│   doesn't exist for AI)     │
└──────────────────────────────┘
       ↓
┌─── Agentic Loop (max 10 iterations) ───┐
│  Provider.completeWithTools(             │
│    messages, filteredTools, options      │
│  )                                       │
│       ↓                                  │
│  Response has tool_calls?                │
│    YES → ToolExecutor.execute(calls)     │
│         → Append results to messages     │
│         → Loop again                     │
│    NO  → Return final text response      │
└──────────────────────────────────────────┘
       ↓
Save assistant message (with toolCalls metadata)
```

### Write Operation Flow (confirmation)

```
AI decides to call stock_create_product(...)
       ↓
ToolExecutor detects: tool requires confirmation
       ↓
Instead of executing, returns PENDING_CONFIRMATION message:
  "Vou criar o produto X com estas propriedades: [preview].
   Confirme para prosseguir."
       ↓
Assistant message saved with:
  - contentType: 'ACTION_CARD'
  - renderData: { action, params, status: 'PENDING' }
       ↓
User replies "sim" / "confirma" / "ok"
       ↓
SendMessageUseCase detects pending action in conversation
       ↓
ToolExecutor.execute(pendingAction)
       ↓
Result saved with audit log reference for undo
```

## New Components

### 1. Tool Definition Types

```
File: src/services/ai-provider/tool-types.ts
```

```typescript
// Use JSON Schema directly for parameters (Gemini accepts standard JSON Schema)
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>; // JSON Schema properties
    required?: string[];
  };
  // Metadata (not sent to provider)
  module: string;
  permission: string;
  requiresConfirmation: boolean;
  category: 'query' | 'action' | 'report';
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string; // JSON stringified result
  isError?: boolean;
}

export interface AiProviderToolResponse {
  content: string | null; // null when tool_calls present
  toolCalls: ToolCall[] | null;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  estimatedCost: number;
}

// Extended message types for the agentic loop
export interface AiToolCallMessage {
  role: 'assistant';
  content: null;
  toolCalls: ToolCall[];
}

export interface AiToolResultMessage {
  role: 'tool';
  toolCallId: string;
  content: string; // JSON stringified result
}

// Union of all message types the agentic loop uses
export type AiAgenticMessage =
  | AiProviderMessage        // system, user, assistant (text)
  | AiToolCallMessage        // assistant with tool calls
  | AiToolResultMessage;     // tool result fed back to provider
```

### 2. Tool Registry

```
File: src/services/ai-tools/tool-registry.ts
```

Central registry that holds all tool definitions organized by module. Filters tools by user permissions before sending to provider.

```typescript
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void;
  getToolsForUser(userPermissions: string[]): ToolDefinition[];
  getTool(name: string): ToolDefinition | undefined;
  getToolsByModule(module: string): ToolDefinition[];
}
```

**Permission filtering**: `getToolsForUser()` checks each tool's `permission` field against the user's permissions array. Tools without matching permission are excluded entirely — the AI never sees them.

### 3. Tool Executor

```
File: src/services/ai-tools/tool-executor.ts
```

Executes tool calls by routing to the appropriate use-case. Handles confirmation logic for write operations.

```typescript
class ToolExecutor {
  constructor(
    private registry: ToolRegistry,
    private useCaseFactory: ToolUseCaseFactory,
  ) {}

  async execute(
    toolCall: ToolCall,
    context: ToolExecutionContext,
  ): Promise<ToolResult>;

  requiresConfirmation(toolName: string): boolean;

  formatPreview(toolName: string, args: Record<string, unknown>): string;
}

interface ToolExecutionContext {
  tenantId: string;
  userId: string;
  permissions: string[];
  conversationId: string;
}
```

### 4. Tool Use-Case Factory

```
File: src/services/ai-tools/tool-use-case-factory.ts
```

Maps tool names to actual use-case instances. Uses existing `make-*-use-case.ts` factories.

```typescript
class ToolUseCaseFactory {
  getHandler(toolName: string): ToolHandler;
}

interface ToolHandler {
  execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<unknown>;
}
```

Each handler is a thin adapter that:
1. Validates and maps AI tool arguments to use-case request format
2. Calls the real use-case (e.g., `makeListProductsUseCase()`)
3. Formats the response for the AI (JSON summary, not full entities)

### 5. Stock Tool Definitions

```
File: src/services/ai-tools/modules/stock-tools.ts
```

All tool definitions for the Stock module, organized by category.

#### Query Tools

| Tool Name | Description | Permission | Parameters |
|-----------|-------------|------------|------------|
| `stock_list_products` | Lista produtos com filtros | `stock.products.access` | search?, status?, categoryId?, templateId?, limit? |
| `stock_get_product` | Detalhes de um produto | `stock.products.access` | productId |
| `stock_count_products` | Conta total de produtos | `stock.products.access` | status? |
| `stock_list_variants` | Lista variantes de um produto | `stock.products.access` | productId?, search?, limit? |
| `stock_list_items` | Lista itens com filtros | `stock.items.access` | variantId?, binId?, status?, limit? |
| `stock_list_categories` | Lista categorias (hierárquica) | `stock.categories.access` | parentId? |
| `stock_list_templates` | Lista templates | `stock.templates.access` | search?, limit? |
| `stock_list_suppliers` | Lista fornecedores | `stock.products.access` | search?, limit? |
| `stock_list_manufacturers` | Lista fabricantes | `stock.manufacturers.access` | search?, limit? |
| `stock_list_tags` | Lista tags | `stock.products.access` | — |
| `stock_list_warehouses` | Lista armazéns | `stock.warehouses.access` | — |
| `stock_list_zones` | Lista zonas de um armazém | `stock.warehouses.access` | warehouseId? |
| `stock_list_bins` | Lista bins com filtros | `stock.warehouses.access` | zoneId?, available?, limit? |
| `stock_list_movements` | Lista movimentações | `stock.items.access` | itemId?, type?, startDate?, endDate?, limit? |
| `stock_list_purchase_orders` | Lista ordens de compra | `stock.purchase-orders.access` | status?, supplierId?, limit? |
| `stock_get_item_location` | Localização atual de um item | `stock.items.access` | itemId |

#### Action Tools (require confirmation)

| Tool Name | Description | Permission | Parameters |
|-----------|-------------|------------|------------|
| `stock_create_product` | Cria um produto | `stock.products.register` | name, templateId, categoryIds?, supplierId?, manufacturerId?, attributes? |
| `stock_update_product` | Atualiza um produto | `stock.products.modify` | productId, name?, status?, attributes? |
| `stock_create_variant` | Cria uma variante | `stock.variants.register` | productId, name, price?, costPrice?, attributes? |
| `stock_update_variant` | Atualiza uma variante | `stock.variants.modify` | variantId, name?, price?, costPrice?, isActive? |
| `stock_register_entry` | Registra entrada de itens | `stock.items.admin` | variantId, binId, quantity, unitCost?, batchNumber? |
| `stock_register_exit` | Registra saída de itens | `stock.items.admin` | itemId, quantity, reasonCode, notes? |
| `stock_transfer_item` | Transfere item entre bins | `stock.items.admin` | itemId, destinationBinId, quantity?, notes? |
| `stock_create_category` | Cria uma categoria | `stock.categories.register` | name, description?, parentId? |
| `stock_create_template` | Cria um template | `stock.templates.register` | name, unitOfMeasure, productAttributes?, variantAttributes? |
| `stock_create_supplier` | Cria um fornecedor | `stock.products.admin` | name, email?, phone?, cnpj? |
| `stock_create_manufacturer` | Cria um fabricante | `stock.manufacturers.register` | name, country?, email? |
| `stock_create_purchase_order` | Cria ordem de compra | `stock.purchase-orders.register` | supplierId, items[], expectedDate?, notes? |
| `stock_create_tag` | Cria uma tag | `stock.products.admin` | name, color?, description? |

#### Report Tools

| Tool Name | Description | Permission | Parameters |
|-----------|-------------|------------|------------|
| `stock_summary` | Resumo geral do estoque | `stock.products.access` | — |
| `stock_low_stock_report` | Itens abaixo do ponto de reposição | `stock.items.access` | warehouseId? |
| `stock_movement_report` | Relatório de movimentações | `stock.items.access` | startDate, endDate, warehouseId?, type? |
| `stock_valuation_report` | Valoração do estoque | `stock.items.access` | warehouseId?, categoryId? |

### 6. Provider Extension (Gemini with Tools)

```
File: src/services/ai-provider/gemini.provider.ts (modified)
```

Extend `GeminiProvider` to implement `completeWithTools()`. Gemini's function calling API accepts tools in the request body as `tools: [{ functionDeclarations: [...] }]`.

The `GeminiResponse` interface must be updated to handle function call responses:

```typescript
// Updated Gemini response parts — can be text OR function call
interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
}

// Tool result sent back to Gemini
interface GeminiFunctionResponse {
  role: 'function';
  parts: Array<{
    functionResponse: {
      name: string;
      response: { content: unknown };
    };
  }>;
}
```

The response may contain `functionCall` objects instead of text. These are mapped to our `ToolCall` interface. When feeding tool results back, Gemini expects `role: 'function'` messages.

```
File: src/services/ai-provider/ai-provider.interface.ts (modified)
```

Add `completeWithTools` method to `AiProvider` interface. Providers that don't support tools throw `ToolsNotSupportedError`. The existing `AiProviderMessage` interface is kept for simple text completions; `AiAgenticMessage` (defined in tool-types.ts) is used for tool-enabled completions.

```
File: src/services/ai-provider/ai-router.ts (modified)
```

Add `completeWithTools` method to `AiRouter` that delegates to the appropriate provider. Selects Tier 3 (Gemini) by default for tool-use requests since it requires better reasoning. Falls back through available tiers if the selected one doesn't support tools.

### 7. Permission Loading

User permissions are NOT on the JWT — they must be loaded from the database. The controller will load permissions before calling the use-case:

```
File: src/http/controllers/ai/chat/v1-send-message.controller.ts (modified)
```

Changes:
1. Fix `onRequest` → `preHandler` for auth middleware (ADR 026 compliance)
2. Load user permissions via `PermissionGroupsRepository.findUserPermissions(tenantId, userId)`
3. Pass `userPermissions: string[]` to the use-case request

The permission loading pattern already exists in other controllers that use `createPermissionMiddleware`. Here we need the raw list of permission codes rather than checking a single permission.

### 8. SendMessageUseCase Modifications

```
File: src/use-cases/ai/conversations/send-message.ts (modified)
```

Changes:
1. Accept `userPermissions: string[]` in the request
2. Load filtered tools from `ToolRegistry.getToolsForUser(permissions)`
3. If tools available, use `completeWithTools` instead of `complete`
4. Implement agentic loop: if response has `tool_calls`, execute them, append results, call provider again
5. Max 10 iterations to prevent infinite loops
6. Detect pending confirmations from previous messages
7. When user confirms, execute the pending action
8. Save `toolCalls` metadata in assistant messages

**Agentic loop error handling**: When a tool execution fails within the loop (e.g., validation error), the error message is fed back to the AI as a tool result with `isError: true`. The AI can then recover — suggest corrections, try a different approach, or explain the error to the user. The loop only terminates on max iterations or when the AI returns a final text response.

**Token budget**: Each tool result is capped at 4000 characters. List results are truncated to 20 items max with a note "(mostrando 20 de N resultados)". This prevents context overflow during multi-step reasoning.

### 8. Stock Agent Instruction File

```
File: src/services/ai-tools/instructions/stock-instructions.md
```

Injected into the system prompt when the user has stock permissions. Contains:

- Module overview and entity relationships
- Hierarchical code system explanation
- How to use each tool effectively
- Business rules (status transitions, required fields)
- Examples of common workflows:
  - "Criar um produto completo" → template → product → variants → items
  - "Resumo do estoque" → stock_summary → format as table
  - "Transferir itens" → find item → verify location → transfer
  - "Relatório de estoque baixo" → low_stock_report → format recommendations
- Confirmation protocol: always show preview before write actions
- Error handling: explain errors in Portuguese, suggest corrections

### 10. Confirmation + Undo Mechanism

**Confirmation flow:**
- Action tools have `requiresConfirmation: true`
- When AI calls an action tool, `ToolExecutor` returns a preview instead of executing
- The preview is saved as an `ACTION_CARD` message with `renderData: { actionId, toolName, args, status: 'PENDING' }`
- **Confirmation detection**: The AI itself handles confirmation — the system prompt instructs it: "When you proposed an action and the user responds, determine if they confirmed, cancelled, or modified the request. If confirmed, call the tool `confirm_pending_action` with the actionId." This avoids fragile regex matching.
- `confirm_pending_action` is a special system tool (always available) that executes the stored pending action
- `cancel_pending_action` is the counterpart that marks it cancelled

**Undo capability:**
- Every executed action saves an `AiActionLog` with:
  - `toolName`, `arguments`, `result`
  - `auditLogId` — reference to the audit system entry
  - `undoData` — the data needed to reverse the action (e.g., previous state snapshot)
- The AI has a `undo_last_action` tool that:
  1. Looks up the last executed action for the conversation
  2. Uses `undoData` + audit system to restore previous state
  3. Records the undo as another audit entry
- This keeps undo as a first-class AI capability rather than requiring UI buttons

## File Map

### New Files

| File | Purpose |
|------|---------|
| `src/services/ai-provider/tool-types.ts` | Tool definition types and interfaces |
| `src/services/ai-tools/tool-registry.ts` | Central tool registry with permission filtering |
| `src/services/ai-tools/tool-executor.ts` | Executes tool calls via use-cases |
| `src/services/ai-tools/tool-use-case-factory.ts` | Maps tool names to use-case handlers |
| `src/services/ai-tools/modules/stock-tools.ts` | Stock module tool definitions |
| `src/services/ai-tools/modules/stock-handlers.ts` | Stock tool execution handlers |
| `src/services/ai-tools/instructions/stock-instructions.md` | Stock module instruction file for system prompt |
| `src/services/ai-tools/index.ts` | Barrel export |

### Modified Files

| File | Change |
|------|--------|
| `src/services/ai-provider/ai-provider.interface.ts` | Add `completeWithTools` method |
| `src/services/ai-provider/ai-router.ts` | Add `completeWithTools` routing |
| `src/services/ai-provider/gemini.provider.ts` | Implement Gemini function calling |
| `src/use-cases/ai/conversations/send-message.ts` | Agentic loop, confirmation handling |
| `src/use-cases/ai/conversations/factories/make-send-message-use-case.ts` | Inject tool registry and executor |
| `src/http/controllers/ai/chat/v1-send-message.controller.ts` | Pass user permissions to use-case |

## Dependencies

No new npm packages. Gemini function calling is done via their REST API (already using fetch).

## Out of Scope

- Tools for other modules (Finance, HR, Sales) — future sub-projects
- Voice input/output
- File attachment analysis
- Scheduled/automated AI actions
- Claude provider tool support (can be added later following same pattern)
- Groq/Llama tool support (model quality insufficient)

## Success Criteria

1. User asks "quantos produtos tenho?" → AI calls `stock_count_products` → returns real count
2. User asks to create a product → AI proposes with preview → user confirms → product created in DB
3. User without `stock.products.register` permission → AI never suggests creating products
4. Multi-step: "Cria um produto eletrônico com 3 variantes" → AI calls create_product, then create_variant 3x
5. Agentic loop works: AI can query data, analyze, and act in sequence
6. Max 10 iterations prevents infinite loops
7. All actions logged in AiActionLog with audit reference
8. Instruction file gives AI enough context to answer domain questions without tool calls
