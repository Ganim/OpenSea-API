import type { ToolRegistry } from './tool-registry';
import type { ToolUseCaseFactory } from './tool-use-case-factory';
import type { ToolCall, ToolResult, ToolExecutionContext } from './tool-types';
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
        content: JSON.stringify({
          error: `Ferramenta "${toolCall.name}" não encontrada.`,
        }),
        isError: true,
      };
    }

    // Action tools require confirmation — return preview instead of executing
    if (tool.requiresConfirmation && tool.category !== 'system') {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          status: 'PENDING_CONFIRMATION',
          action: toolCall.name,
          description: tool.description,
          params: toolCall.arguments,
          message: `Ação "${tool.description}" requer confirmação do usuário. Apresente um preview claro dos dados e peça confirmação antes de chamar confirm_pending_action.`,
        }),
        pendingConfirmation: {
          toolCall,
          toolName: toolCall.name,
          module: tool.module,
        },
      };
    }

    const handler = this.factory.getHandler(toolCall.name);

    if (!handler) {
      return {
        toolCallId: toolCall.id,
        content: JSON.stringify({
          error: `Handler para "${toolCall.name}" não implementado.`,
        }),
        isError: true,
      };
    }

    try {
      const result = await handler.execute(toolCall.arguments, context);
      let content = JSON.stringify(result);

      // Truncate if too large
      if (content.length > TOOL_RESULT_MAX_CHARS) {
        content =
          content.slice(0, TOOL_RESULT_MAX_CHARS) + '... (resultado truncado)';
      }

      return { toolCallId: toolCall.id, content };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
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

  /**
   * Execute a tool directly, bypassing the confirmation check.
   * Used by the confirmation flow after the user approves a pending action.
   */
  async executeDirect(
    toolName: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext,
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const handler = this.factory.getHandler(toolName);

    if (!handler) {
      return {
        success: false,
        error: `Handler para "${toolName}" não implementado.`,
      };
    }

    try {
      const result = await handler.execute(args, context);
      return { success: true, result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: message };
    }
  }
}
