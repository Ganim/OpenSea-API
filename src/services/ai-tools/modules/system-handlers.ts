import type { ToolHandler, ToolExecutionContext } from '../tool-types';

export function getSystemHandlers(): Record<string, ToolHandler> {
  return {
    confirm_pending_action: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        // Full implementation will connect to AiActionLog later
        return {
          status: 'CONFIRMED',
          actionId: args.actionId as string,
          message: 'Ação confirmada e executada.',
        };
      },
    },

    cancel_pending_action: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        return {
          status: 'CANCELLED',
          actionId: args.actionId as string,
          message: 'Ação cancelada.',
        };
      },
    },

    undo_last_action: {
      async execute(
        _args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        return {
          status: 'UNDO_NOT_AVAILABLE',
          message: 'Funcionalidade de desfazer será implementada em breve.',
        };
      },
    },
  };
}
