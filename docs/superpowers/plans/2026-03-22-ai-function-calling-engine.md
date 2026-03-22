# AI Function Calling Engine + Stock Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add function calling (tool_use) to the Atlas AI assistant so it can query real Stock module data and execute actions via existing use-cases, with RBAC permission filtering and confirmation for write operations.

**Architecture:** ToolRegistry holds tool definitions filtered by user permissions. ToolExecutor routes tool calls to use-case handlers. GeminiProvider extended with `completeWithTools`. SendMessageUseCase runs an agentic loop (max 10 iterations) where the AI can call tools, receive results, and reason further before responding.

**Tech Stack:** TypeScript, Fastify, Prisma, Gemini REST API (function calling), existing OpenSea-API infrastructure

**Spec:** `docs/superpowers/specs/2026-03-22-ai-function-calling-engine-design.md`

**Spec deviations:**
- Types placed in `src/services/ai-tools/tool-types.ts` (not `ai-provider/`) for better separation
- `ToolDefinition.category` includes `'system'` (4th value, not in spec) for confirm/cancel/undo tools that bypass permission checks

**Key implementation notes:**
- Gemini does NOT return `toolCallId` in function call responses — generate synthetic IDs (`crypto.randomUUID()`)
- Gemini can return mixed responses (text + function calls in same response) — handle both parts
- Use `getPermissionService()` (not `makePermissionService()`) to load user permissions
- `getUserPermissionCodes()` takes `UniqueEntityID`, not plain string — wrap with `new UniqueEntityID(userId)`
- Instruction file should be exported as a string constant from a `.ts` file (not `fs.readFileSync` — incompatible with `tsup` bundler)
- Agentic loop: push ONE assistant message with ALL tool calls, then push each tool result separately

---

## File Map

### New Files (Create)
| File | Responsibility |
|------|---------------|
| `src/services/ai-tools/tool-types.ts` | ToolDefinition, ToolCall, ToolResult, AiAgenticMessage types |
| `src/services/ai-tools/tool-registry.ts` | Central registry with permission filtering |
| `src/services/ai-tools/tool-executor.ts` | Executes tool calls, handles confirmation flow |
| `src/services/ai-tools/tool-use-case-factory.ts` | Maps tool names to use-case handlers |
| `src/services/ai-tools/modules/stock-tools.ts` | Stock module tool definitions (30+ tools) |
| `src/services/ai-tools/modules/stock-handlers.ts` | Stock tool execution handlers |
| `src/services/ai-tools/instructions/stock-instructions.ts` | Stock module instruction constant for system prompt |
| `src/services/ai-tools/modules/system-handlers.ts` | System tool handlers (confirm, cancel, undo) |
| `src/services/ai-tools/index.ts` | Barrel export |
| `src/services/ai-tools/make-tool-registry.ts` | Factory for tool registry singleton |

### Modified Files
| File | Change |
|------|--------|
| `src/services/ai-provider/ai-provider.interface.ts` | Add `completeWithTools` method |
| `src/services/ai-provider/gemini.provider.ts` | Implement Gemini function calling |
| `src/services/ai-provider/ai-router.ts` | Add `completeWithTools` routing |
| `src/use-cases/ai/conversations/send-message.ts` | Agentic loop, confirmation, permission-aware |
| `src/use-cases/ai/conversations/factories/make-send-message-use-case.ts` | Inject tool registry/executor |
| `src/http/controllers/ai/chat/v1-send-message.controller.ts` | Load permissions, fix onRequest→preHandler |

---

## Task 1: Tool Types and Interfaces

**Files:**
- Create: `src/services/ai-tools/tool-types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/services/ai-tools/tool-types.ts

import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';

// === Tool Definitions ===

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  // Metadata (not sent to provider)
  module: string;
  permission: string;
  requiresConfirmation: boolean;
  category: 'query' | 'action' | 'report' | 'system';
}

// === Tool Execution ===

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface ToolExecutionContext {
  tenantId: string;
  userId: string;
  permissions: string[];
  conversationId: string;
}

export interface ToolHandler {
  execute(
    args: Record<string, unknown>,
    context: ToolExecutionContext,
  ): Promise<unknown>;
}

// === Provider Messages for Agentic Loop ===

export interface AiToolCallMessage {
  role: 'assistant';
  content: null;
  toolCalls: ToolCall[];
}

export interface AiToolResultMessage {
  role: 'tool';
  toolCallId: string;
  content: string;
}

export type AiAgenticMessage =
  | AiProviderMessage
  | AiToolCallMessage
  | AiToolResultMessage;

// === Provider Response with Tools ===

export interface AiProviderToolResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  estimatedCost: number;
}

// === Constants ===

export const AGENTIC_LOOP_MAX_ITERATIONS = 10;
export const TOOL_RESULT_MAX_CHARS = 4000;
export const TOOL_LIST_MAX_ITEMS = 20;
```

- [ ] **Step 2: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-tools/tool-types.ts
git commit -m "feat(ai): add tool types and interfaces for function calling"
```

---

## Task 2: Tool Registry

**Files:**
- Create: `src/services/ai-tools/tool-registry.ts`
- Create: `src/services/ai-tools/make-tool-registry.ts`

- [ ] **Step 1: Create the registry**

```typescript
// src/services/ai-tools/tool-registry.ts

import type { ToolDefinition } from './tool-types';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerMany(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByModule(module: string): ToolDefinition[] {
    return this.getAllTools().filter((t) => t.module === module);
  }

  /**
   * Returns only tools the user has permission to use.
   * Tools without matching permission are excluded entirely —
   * the AI never sees them.
   */
  getToolsForUser(userPermissions: string[]): ToolDefinition[] {
    const permSet = new Set(userPermissions);
    return this.getAllTools().filter(
      (tool) => tool.category === 'system' || permSet.has(tool.permission),
    );
  }

  /**
   * Convert tool definitions to the format expected by Gemini API.
   * Strips metadata fields (module, permission, etc.)
   */
  toProviderFormat(tools: ToolDefinition[]): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }
}
```

- [ ] **Step 2: Create the factory**

```typescript
// src/services/ai-tools/make-tool-registry.ts

import { ToolRegistry } from './tool-registry';
import { getStockTools } from './modules/stock-tools';

let cached: ToolRegistry | null = null;

export function makeToolRegistry(): ToolRegistry {
  if (cached) return cached;

  const registry = new ToolRegistry();
  registry.registerMany(getStockTools());
  // Future: registry.registerMany(getFinanceTools());

  cached = registry;
  return registry;
}

export function clearToolRegistryCache(): void {
  cached = null;
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-tools/tool-registry.ts src/services/ai-tools/make-tool-registry.ts
git commit -m "feat(ai): add tool registry with permission filtering"
```

---

## Task 3: Extend AI Provider Interface + Gemini Function Calling

**Files:**
- Modify: `src/services/ai-provider/ai-provider.interface.ts`
- Modify: `src/services/ai-provider/gemini.provider.ts`
- Modify: `src/services/ai-provider/ai-router.ts`

This is the core integration — teaching the Gemini provider to send/receive tool calls.

- [ ] **Step 1: Extend the provider interface**

Add to `src/services/ai-provider/ai-provider.interface.ts`:

```typescript
// Add these imports and types AFTER the existing interfaces

import type {
  ToolDefinition,
  AiAgenticMessage,
  AiProviderToolResponse,
} from '@/services/ai-tools/tool-types';

export interface AiProviderWithTools extends AiProvider {
  completeWithTools(
    messages: AiAgenticMessage[],
    tools: ToolDefinition[],
    options?: AiProviderOptions,
  ): Promise<AiProviderToolResponse>;
  supportsTools(): boolean;
}
```

- [ ] **Step 2: Implement Gemini function calling**

Modify `src/services/ai-provider/gemini.provider.ts`.

Key changes:
1. Implement `AiProviderWithTools` interface
2. Add `completeWithTools()` method that sends `tools: [{ functionDeclarations }]` in the request body
3. Parse `functionCall` parts from the response (not just `text` parts)
4. Handle `role: 'tool'` messages by converting to Gemini's `role: 'function'` format
5. Add `supportsTools()` returning `true`

The Gemini function calling format:
- Request: `tools: [{ functionDeclarations: [{ name, description, parameters }] }]`
- Response parts: `{ functionCall: { name, args } }` instead of `{ text }` — **Gemini does NOT return a toolCallId, so generate synthetic IDs with `crypto.randomUUID()`**
- Response can contain BOTH text parts and functionCall parts — handle mixed responses
- Tool results sent as: `{ role: 'function', parts: [{ functionResponse: { name, response: { content } } }] }`

IMPORTANT: Read the existing `gemini.provider.ts` FIRST to understand the current structure, then extend it. Do NOT rewrite the existing `complete()` method — add `completeWithTools()` alongside it.

Also read the spec at `docs/superpowers/specs/2026-03-22-ai-function-calling-engine-design.md` sections 6 for the Gemini response type details.

- [ ] **Step 3: Extend the router**

Add to `src/services/ai-provider/ai-router.ts`:

```typescript
// Add completeWithTools method to AiRouter class
async completeWithTools(
  messages: AiAgenticMessage[],
  tools: ToolDefinition[],
  tier?: AiTier,
  options?: AiProviderOptions,
): Promise<AiProviderToolResponse & { tier: AiTier }> {
  // Default to tier 3 for tool use (requires better reasoning)
  const selectedTier = tier ?? 3;
  const provider = this.providers.get(selectedTier);

  if (!provider || !('completeWithTools' in provider)) {
    // Fallback: try other tiers that support tools
    for (const [t, p] of this.providers.entries()) {
      if ('completeWithTools' in p && (p as any).supportsTools()) {
        const response = await (p as AiProviderWithTools).completeWithTools(
          messages, tools, options,
        );
        return { ...response, tier: t };
      }
    }
    throw new Error('No AI provider with tool support available');
  }

  const response = await (provider as AiProviderWithTools).completeWithTools(
    messages, tools, options,
  );
  return { ...response, tier: selectedTier };
}
```

IMPORTANT: Read the existing `ai-router.ts` to understand imports and structure. Add proper imports for the new types.

- [ ] **Step 4: Verify compilation**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-provider/
git commit -m "feat(ai): extend Gemini provider with function calling support"
```

---

## Task 4: Stock Tool Definitions

**Files:**
- Create: `src/services/ai-tools/modules/stock-tools.ts`

- [ ] **Step 1: Create all stock tool definitions**

This file exports a `getStockTools()` function that returns an array of `ToolDefinition` objects. Each tool maps to an existing use-case in the Stock module.

The file must define:

**Query tools (16):** `stock_list_products`, `stock_get_product`, `stock_count_products`, `stock_list_variants`, `stock_list_items`, `stock_list_categories`, `stock_list_templates`, `stock_list_suppliers`, `stock_list_manufacturers`, `stock_list_tags`, `stock_list_warehouses`, `stock_list_zones`, `stock_list_bins`, `stock_list_movements`, `stock_list_purchase_orders`, `stock_get_item_location`

**Action tools (13):** `stock_create_product`, `stock_update_product`, `stock_create_variant`, `stock_update_variant`, `stock_register_entry`, `stock_register_exit`, `stock_transfer_item`, `stock_create_category`, `stock_create_template`, `stock_create_supplier`, `stock_create_manufacturer`, `stock_create_purchase_order`, `stock_create_tag`

**Report tools (4):** `stock_summary`, `stock_low_stock_report`, `stock_movement_report`, `stock_valuation_report`

**System tools (3):** `confirm_pending_action`, `cancel_pending_action`, `undo_last_action`

Each definition uses JSON Schema for parameters. Permission codes must match exactly those in `src/constants/rbac/permission-codes.ts`:
- Products: `stock.products.access`, `stock.products.register`, `stock.products.modify`
- Variants: `stock.variants.access`, `stock.variants.register`, `stock.variants.modify`
- Items: `stock.items.access`, `stock.items.admin`
- Categories: `stock.categories.access`, `stock.categories.register`
- Templates: `stock.templates.access`, `stock.templates.register`
- Manufacturers: `stock.manufacturers.access`, `stock.manufacturers.register`
- Warehouses: `stock.warehouses.access`
- Purchase Orders: `stock.purchase-orders.access`, `stock.purchase-orders.register`
- Suppliers/Tags (no own code): use `stock.products.access` for read, `stock.products.admin` for write

System tools (`confirm_pending_action`, `cancel_pending_action`, `undo_last_action`) have `category: 'system'` — they bypass permission checks (always available).

IMPORTANT: Read `src/constants/rbac/permission-codes.ts` to verify exact code strings before writing the definitions.

- [ ] **Step 2: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-tools/modules/stock-tools.ts
git commit -m "feat(ai): add 36 stock module tool definitions with permission mapping"
```

---

## Task 5: Stock Tool Handlers

**Files:**
- Create: `src/services/ai-tools/modules/stock-handlers.ts`
- Create: `src/services/ai-tools/tool-use-case-factory.ts`

- [ ] **Step 1: Create the tool use-case factory**

```typescript
// src/services/ai-tools/tool-use-case-factory.ts

import type { ToolHandler } from './tool-types';
import { getStockHandlers } from './modules/stock-handlers';

export class ToolUseCaseFactory {
  private handlers: Map<string, ToolHandler> = new Map();

  constructor() {
    // Register stock handlers
    const stockHandlers = getStockHandlers();
    for (const [name, handler] of Object.entries(stockHandlers)) {
      this.handlers.set(name, handler);
    }
  }

  getHandler(toolName: string): ToolHandler | undefined {
    return this.handlers.get(toolName);
  }

  hasHandler(toolName: string): boolean {
    return this.handlers.has(toolName);
  }
}
```

- [ ] **Step 2: Create stock handlers**

`src/services/ai-tools/modules/stock-handlers.ts` exports `getStockHandlers()` which returns a `Record<string, ToolHandler>`.

Each handler:
1. Instantiates the corresponding use-case via its existing `make-*-use-case` factory
2. Maps the tool arguments to the use-case request format
3. Calls the use-case with `tenantId` from context
4. Formats the response (truncates to `TOOL_RESULT_MAX_CHARS`, limits lists to `TOOL_LIST_MAX_ITEMS`)
5. Returns JSON-stringified result

Example handler pattern:
```typescript
stock_list_products: {
  async execute(args, context) {
    const useCase = makeListProductsUseCase();
    const result = await useCase.execute({
      tenantId: context.tenantId,
      search: args.search as string | undefined,
      status: args.status as string | undefined,
      page: 1,
      limit: Math.min((args.limit as number) ?? 10, TOOL_LIST_MAX_ITEMS),
    });
    return {
      total: result.meta.total,
      products: result.products.map(p => ({
        id: p.id, name: p.name, status: p.status, fullCode: p.fullCode,
      })),
    };
  },
},
```

IMPORTANT: You must read the existing use-case factories to understand:
1. How to import them: `src/use-cases/stock/products/factories/make-list-products-use-case.ts`
2. What parameters each use-case expects (read the use-case file)
3. What the response shape is

Start with query handlers only (list/get/count for each entity). Action handlers should implement the full creation/update logic — the ToolExecutor will gate them with `PENDING_CONFIRMATION` before they execute.

For report tools (`stock_summary`, `stock_low_stock_report`, etc.), compose multiple use-case calls to aggregate data.

Also create `src/services/ai-tools/modules/system-handlers.ts` with handlers for the 3 system tools:
- `confirm_pending_action`: Look up last `ACTION_CARD` message with `PENDING` status in the conversation, execute the stored action, save result to `AiActionLog` with audit reference, update message status to `EXECUTED`
- `cancel_pending_action`: Look up last pending action, mark as `CANCELLED`
- `undo_last_action`: Look up last `EXECUTED` action in `AiActionLog`, use `undoData` to reverse (soft-delete if create, restore if update)

These handlers need access to `AiMessagesRepository` and `AiActionLogsRepository` — accept them via the `ToolExecutionContext` or inject at factory construction time.

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-tools/tool-use-case-factory.ts src/services/ai-tools/modules/stock-handlers.ts
git commit -m "feat(ai): add stock tool handlers connected to real use-cases"
```

---

## Task 6: Tool Executor

**Files:**
- Create: `src/services/ai-tools/tool-executor.ts`

- [ ] **Step 1: Create the executor**

```typescript
// src/services/ai-tools/tool-executor.ts

import type { ToolRegistry } from './tool-registry';
import type { ToolUseCaseFactory } from './tool-use-case-factory';
import type {
  ToolCall,
  ToolResult,
  ToolExecutionContext,
} from './tool-types';
import { TOOL_RESULT_MAX_CHARS } from './tool-types';

export class ToolExecutor {
  constructor(
    private registry: ToolRegistry,
    private factory: ToolUseCaseFactory,
  ) {}

  async execute(
    toolCall: ToolCall,
    context: ToolExecutionContext,
  ): Promise<ToolResult> {
    const tool = this.registry.getTool(toolCall.name);

    if (!tool) {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({ error: `Ferramenta "${toolCall.name}" não encontrada.` }),
        isError: true,
      };
    }

    // Check if tool requires confirmation and is NOT a system confirmation tool
    if (tool.requiresConfirmation && tool.category !== 'system') {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          status: 'PENDING_CONFIRMATION',
          action: toolCall.name,
          params: toolCall.arguments,
          message: `Ação "${tool.description}" requer confirmação do usuário. Apresente um preview dos dados e peça confirmação.`,
        }),
      };
    }

    const handler = this.factory.getHandler(toolCall.name);

    if (!handler) {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({ error: `Handler para "${toolCall.name}" não implementado.` }),
        isError: true,
      };
    }

    try {
      const result = await handler.execute(toolCall.arguments, context);
      const content = JSON.stringify(result);

      // Truncate if too large
      if (content.length > TOOL_RESULT_MAX_CHARS) {
        return {
          toolCallId: toolCall.id,
          content: content.slice(0, TOOL_RESULT_MAX_CHARS) + '... (resultado truncado)',
        };
      }

      return { toolCallId: toolCall.id, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({ error: message }),
        isError: true,
      };
    }
  }

  requiresConfirmation(toolName: string): boolean {
    const tool = this.registry.getTool(toolName);
    return tool?.requiresConfirmation ?? false;
  }
}
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/services/ai-tools/index.ts
export { ToolRegistry } from './tool-registry';
export { ToolExecutor } from './tool-executor';
export { ToolUseCaseFactory } from './tool-use-case-factory';
export { makeToolRegistry, clearToolRegistryCache } from './make-tool-registry';
export * from './tool-types';
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-tools/
git commit -m "feat(ai): add tool executor with confirmation flow and error handling"
```

---

## Task 7: Stock Agent Instruction File

**Files:**
- Create: `src/services/ai-tools/instructions/stock-instructions.ts`

- [ ] **Step 1: Write the instruction file**

This file exports a `STOCK_INSTRUCTIONS` string constant (template literal) that is injected into the system prompt when the user has stock permissions. Using a `.ts` file instead of `.md` + `fs.readFileSync` ensures compatibility with the `tsup` bundler.

```typescript
// src/services/ai-tools/instructions/stock-instructions.ts
export const STOCK_INSTRUCTIONS = `
... content below ...
`;
```

It must contain:

1. **Module overview**: "O módulo de Estoque (Stock) gerencia produtos, variantes, itens, armazéns, fornecedores, fabricantes, categorias, templates, tags, ordens de compra e volumes."

2. **Entity relationships**: Product → Variants → Items → Bins → Zones → Warehouses. Templates define attributes. Categories organize products. Tags label products.

3. **Hierarchical code system**: Template(3).Manufacturer(3).Product(4).Variant(3)-Item(5) = "001.001.0001.001-00001"

4. **Status transitions**: Product (ACTIVE/INACTIVE/OUT_OF_STOCK/DISCONTINUED), Item (AVAILABLE/RESERVED/DAMAGED/EXPIRED/DISPOSED)

5. **How to use tools effectively**:
   - Always query before creating (check if entity exists)
   - Creating a complete product requires: template first → then product → then variants → then items with bin location
   - Reports combine multiple queries

6. **Confirmation protocol**: "Para ações que modificam dados (criar, editar, excluir), SEMPRE apresente um preview claro dos dados antes de executar. Use a ferramenta confirm_pending_action somente após o usuário confirmar explicitamente."

7. **Response formatting**: "Formate respostas com markdown: use tabelas para listas, negrito para números importantes, e organize dados de forma clara."

8. **Error handling**: "Se uma ferramenta retornar erro, explique o problema em linguagem simples e sugira correções."

IMPORTANT: Read the entity files in `src/entities/stock/` to get the exact field names and relationships. Read `src/entities/stock/value-objects/` for status enums and business rules.

- [ ] **Step 2: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/services/ai-tools/instructions/stock-instructions.ts
git commit -m "feat(ai): add stock module instruction file for AI agent context"
```

---

## Task 8: Modify SendMessageUseCase (Agentic Loop)

**Files:**
- Modify: `src/use-cases/ai/conversations/send-message.ts`
- Modify: `src/use-cases/ai/conversations/factories/make-send-message-use-case.ts`

This is the most complex task — adding the agentic loop to the existing use-case.

- [ ] **Step 1: Read the existing files thoroughly**

Read these files completely before writing any code:
- `src/use-cases/ai/conversations/send-message.ts` (the full use-case)
- `src/use-cases/ai/conversations/factories/make-send-message-use-case.ts`
- `src/services/ai-tools/tool-types.ts` (the types you'll use)
- `src/services/ai-tools/instructions/stock-instructions.md` (to understand how it's loaded)

- [ ] **Step 2: Update the factory to inject tool dependencies**

Modify `make-send-message-use-case.ts` to also create and inject:
- `makeToolRegistry()` → ToolRegistry
- `new ToolUseCaseFactory()` → ToolUseCaseFactory
- `new ToolExecutor(registry, factory)` → ToolExecutor

Pass all three to the SendMessageUseCase constructor.

- [ ] **Step 3: Modify SendMessageUseCase**

Key changes to `send-message.ts`:

1. **Constructor**: Accept `ToolRegistry`, `ToolExecutor` as additional dependencies

2. **Request interface**: Add `userPermissions: string[]` field

3. **System prompt**: Import the stock instruction constant from `src/services/ai-tools/instructions/stock-instructions.ts` (exported as `STOCK_INSTRUCTIONS` string constant) and append to the system prompt when user has any stock permission.

4. **Tool loading**: Call `this.toolRegistry.getToolsForUser(request.userPermissions)` to get filtered tools.

5. **Agentic loop**: Replace the simple `this.aiRouter.complete()` call with:

```typescript
// If tools available, use agentic loop
if (filteredTools.length > 0) {
  let loopMessages: AiAgenticMessage[] = [...aiMessages];
  let finalContent: string | null = null;
  let allToolCalls: ToolCall[] = [];
  let totalTokensIn = 0, totalTokensOut = 0, totalLatency = 0, totalCost = 0;

  for (let i = 0; i < AGENTIC_LOOP_MAX_ITERATIONS; i++) {
    const response = await this.aiRouter.completeWithTools(
      loopMessages, filteredTools, tier,
    );
    totalTokensIn += response.tokensInput;
    totalTokensOut += response.tokensOutput;
    totalLatency += response.latencyMs;
    totalCost += response.estimatedCost;
    aiModel = response.model;
    usedTier = response.tier;

    if (response.toolCalls && response.toolCalls.length > 0) {
      allToolCalls.push(...response.toolCalls);
      // Push ONE assistant message with ALL tool calls
      loopMessages.push({
        role: 'assistant',
        content: response.content, // may have partial text alongside tool calls
        toolCalls: response.toolCalls,
      });
      // Execute each tool call and push results separately
      for (const tc of response.toolCalls) {
        const result = await this.toolExecutor.execute(tc, {
          tenantId: request.tenantId,
          userId: request.userId,
          permissions: request.userPermissions,
          conversationId,
        });
        loopMessages.push({ role: 'tool', toolCallId: tc.id, content: result.content });
      }
    } else {
      // No tool calls — AI has a final text response
      finalContent = response.content;
      break;
    }
  }

  aiContent = finalContent ?? 'Desculpe, não consegui completar a análise. Tente reformular sua pergunta.';
  aiTokensInput = totalTokensIn;
  aiTokensOutput = totalTokensOut;
  aiLatencyMs = totalLatency;
  aiCost = totalCost;
}
```

6. **Save toolCalls metadata**: When saving the assistant message, include `toolCalls: allToolCalls.length > 0 ? allToolCalls : null` in the create call.

IMPORTANT: Keep the existing fallback path (no tools / no providers) intact. The agentic loop is only used when `filteredTools.length > 0`.

- [ ] **Step 4: Verify compilation**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/use-cases/ai/conversations/ src/services/ai-tools/
git commit -m "feat(ai): add agentic loop to SendMessageUseCase with tool execution"
```

---

## Task 9: Update Controller (Permissions + Middleware Fix)

**Files:**
- Modify: `src/http/controllers/ai/chat/v1-send-message.controller.ts`

- [ ] **Step 1: Read existing controller and permission service**

Read:
- `src/http/controllers/ai/chat/v1-send-message.controller.ts`
- `src/services/rbac/permission-service.ts` (find `getUserPermissionCodes` method)
- How other controllers load the permission service (search for `makePermissionService` or `PermissionService` factory)

- [ ] **Step 2: Update the controller**

Changes:
1. Fix `onRequest` → `preHandler` (ADR 026)
2. Load user permissions via PermissionService before calling use-case
3. Pass `userPermissions` to the use-case

```typescript
// Key changes in handler:
const permissionService = getPermissionService(); // from src/services/rbac/get-permission-service.ts
const userPermissions = await permissionService.getUserPermissionCodes(
  new UniqueEntityID(userId),
);

const useCase = makeSendMessageUseCase();
const result = await useCase.execute({
  tenantId,
  userId,
  userPermissions,
  ...request.body,
});
```

IMPORTANT: Read how `PermissionService` is instantiated in other controllers. It likely has a factory or is created with repository dependencies.

- [ ] **Step 3: Verify build**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/http/controllers/ai/chat/v1-send-message.controller.ts
git commit -m "feat(ai): load user permissions in send-message controller, fix preHandler"
```

---

## Task 10: Integration Test

**Files:**
- The goal is to verify the full flow works end-to-end

- [ ] **Step 1: Start the dev server and test manually**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
npm run dev
```

Test with the admin user (`admin@teste.com` / `Teste@123`):

1. Login and select tenant
2. Navigate to `/ai` in the frontend
3. Ask: "Quantos produtos tenho cadastrados?"
4. Verify the AI calls `stock_count_products` and returns a real number
5. Ask: "Liste meus templates"
6. Verify the AI calls `stock_list_templates` and shows real data
7. Ask: "Crie um produto chamado Teste AI"
8. Verify the AI proposes the action and waits for confirmation

- [ ] **Step 2: Fix any issues found**

Common issues:
- Gemini API format mismatches (check response parsing)
- Permission codes not matching (verify with actual user permissions)
- Use-case parameter mapping errors
- Tool result formatting issues

- [ ] **Step 3: Final commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add -A
git commit -m "fix(ai): integration fixes for function calling engine"
```

---

## Summary

| Task | Description | Est. Files | Complexity |
|------|------------|-----------|------------|
| 1 | Tool types and interfaces | 1 | Low |
| 2 | Tool registry with permission filtering | 2 | Low |
| 3 | Gemini function calling + router | 3 | High |
| 4 | Stock tool definitions (36 tools) | 1 | Medium |
| 5 | Stock handlers + use-case factory | 2 | High |
| 6 | Tool executor with confirmation | 2 | Medium |
| 7 | Stock instruction file | 1 | Medium |
| 8 | SendMessageUseCase agentic loop | 2 | High |
| 9 | Controller update (permissions) | 1 | Low |
| 10 | Integration test | 0-N | Medium |

**Total: 10 tasks, ~15 files, 10 commits**

**Critical path:** Tasks 1→4→2→3→5→6→7→8→9→10 (sequential). Task 4 (stock-tools) must complete before Task 2 (registry imports stock-tools). Task 7 (instructions) can run in parallel with Tasks 5/6.
