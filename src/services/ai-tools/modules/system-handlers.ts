import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { makeUndoActionUseCase } from '@/use-cases/ai/actions/factories/make-undo-action-use-case';
import { PrismaAiActionLogsRepository } from '@/repositories/ai/prisma/prisma-ai-action-logs-repository';

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
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        try {
          let actionLogId = args.actionId as string | undefined;

          // If no specific actionId was given, find the last executed action in this conversation
          if (!actionLogId) {
            const actionLogsRepo = new PrismaAiActionLogsRepository();
            const lastAction =
              await actionLogsRepo.findLastExecutedByConversation(
                context.conversationId,
                context.tenantId,
              );

            if (!lastAction) {
              return {
                status: 'UNDO_NOT_AVAILABLE',
                message:
                  'Nenhuma ação executada encontrada nesta conversa para desfazer.',
              };
            }

            actionLogId = lastAction.id;
          }

          const undoUseCase = makeUndoActionUseCase();
          const result = await undoUseCase.execute({
            actionLogId,
            tenantId: context.tenantId,
            userId: context.userId,
          });

          return {
            status: 'UNDONE',
            message: result.message,
            undoneActionId: result.undoneActionId,
            entityType: result.entityType,
            entityId: result.entityId,
            originalAction: result.originalAction,
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Erro desconhecido';
          return {
            status: 'UNDO_FAILED',
            message,
          };
        }
      },
    },
  };
}
