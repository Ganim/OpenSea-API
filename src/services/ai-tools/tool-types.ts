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
  /** Set when the tool requires user confirmation before execution */
  pendingConfirmation?: {
    toolCall: ToolCall;
    toolName: string;
    module: string;
  };
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
  content: string | null;
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

// === Extended Provider Interface ===

export interface AiProviderWithTools {
  completeWithTools(
    messages: AiAgenticMessage[],
    tools: ToolDefinition[],
    options?: { temperature?: number; maxTokens?: number; model?: string },
  ): Promise<AiProviderToolResponse>;
  supportsTools(): boolean;
}

// === Constants ===

export const AGENTIC_LOOP_MAX_ITERATIONS = 10;
export const TOOL_RESULT_MAX_CHARS = 4000;
export const TOOL_LIST_MAX_ITEMS = 20;
