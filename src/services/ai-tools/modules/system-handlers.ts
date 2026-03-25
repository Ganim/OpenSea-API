import type { ToolHandler, ToolExecutionContext } from '../tool-types';

export function getSystemHandlers(): Record<string, ToolHandler> {
  return {
    confirm_pending_action: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        // The actual confirmation is handled by SendMessageUseCase when the user
        // sends "Confirmar ação: {actionId}". If the AI calls this tool directly,
        // we instruct it to wait for user confirmation.
        return {
          status: 'AWAITING_USER_CONFIRMATION',
          actionId: args.actionId as string,
          message:
            'A confirmação deve ser feita pelo usuário. Apresente os detalhes da ação e aguarde a resposta do usuário.',
        };
      },
    },

    cancel_pending_action: {
      async execute(
        args: Record<string, unknown>,
        _context: ToolExecutionContext,
      ) {
        // Same as confirm — cancellation is handled by SendMessageUseCase
        return {
          status: 'AWAITING_USER_DECISION',
          actionId: args.actionId as string,
          message:
            'O cancelamento deve ser feito pelo usuário. Aguarde a resposta do usuário.',
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
