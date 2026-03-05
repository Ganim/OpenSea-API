import type { BoardAutomationsRepository } from '@/repositories/tasks/board-automations-repository';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import type { AutomationTrigger } from './create-automation';

interface AutomationContext {
  cardId: string;
  userId: string;
  columnId?: string;
  fromColumnId?: string;
  toColumnId?: string;
  fieldName?: string;
  fieldValue?: unknown;
}

interface ExecuteAutomationRequest {
  tenantId: string;
  boardId: string;
  trigger: AutomationTrigger;
  context: AutomationContext;
}

interface ExecuteAutomationResponse {
  executedCount: number;
}

export class ExecuteAutomationUseCase {
  constructor(
    private boardAutomationsRepository: BoardAutomationsRepository,
    private cardsRepository: CardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: ExecuteAutomationRequest,
  ): Promise<ExecuteAutomationResponse> {
    const { boardId, trigger, context } = request;

    const activeAutomations =
      await this.boardAutomationsRepository.findActiveByBoardAndTrigger(
        boardId,
        trigger,
      );

    let executedCount = 0;

    for (const automation of activeAutomations) {
      try {
        const matchesTrigger = this.checkTriggerMatch(
          trigger,
          automation.triggerConfig,
          context,
        );

        if (!matchesTrigger) {
          continue;
        }

        const card = await this.cardsRepository.findById(
          context.cardId,
          boardId,
        );

        if (!card) {
          continue;
        }

        const actionDescription = await this.executeAction(
          automation.action,
          automation.actionConfig,
          context.cardId,
          boardId,
        );

        if (actionDescription) {
          await this.cardActivitiesRepository.create({
            cardId: context.cardId,
            boardId,
            userId: context.userId,
            type: 'AUTOMATION_TRIGGERED',
            description: `Automacao '${automation.name}' ${actionDescription} o cartao ${card.title}`,
            metadata: {
              automationId: automation.id,
              automationName: automation.name,
              trigger,
              action: automation.action,
            },
          });

          executedCount++;
        }
      } catch {
        // Errors are caught silently to allow the next automation to proceed
        continue;
      }
    }

    return { executedCount };
  }

  private checkTriggerMatch(
    trigger: AutomationTrigger,
    triggerConfig: Record<string, unknown>,
    context: AutomationContext,
  ): boolean {
    switch (trigger) {
      case 'CARD_MOVED': {
        if (
          triggerConfig.fromColumnId &&
          triggerConfig.fromColumnId !== context.fromColumnId
        ) {
          return false;
        }
        if (
          triggerConfig.toColumnId &&
          triggerConfig.toColumnId !== context.toColumnId
        ) {
          return false;
        }
        return true;
      }

      case 'CARD_CREATED':
      case 'ALL_SUBTASKS_DONE':
      case 'DUE_DATE_REACHED':
        return true;

      case 'FIELD_CHANGED': {
        if (
          triggerConfig.fieldName &&
          triggerConfig.fieldName !== context.fieldName
        ) {
          return false;
        }
        return true;
      }

      default:
        return false;
    }
  }

  private async executeAction(
    action: string,
    actionConfig: Record<string, unknown>,
    cardId: string,
    boardId: string,
  ): Promise<string | null> {
    switch (action) {
      case 'MOVE_CARD': {
        const targetColumnId = actionConfig.columnId as string | undefined;
        if (!targetColumnId) return null;

        const targetColumn = await this.boardColumnsRepository.findById(
          targetColumnId,
          boardId,
        );
        if (!targetColumn) return null;

        await this.cardsRepository.update({
          id: cardId,
          boardId,
          columnId: targetColumnId,
        });

        return `moveu para coluna '${targetColumn.title}'`;
      }

      case 'SET_FIELD': {
        const fieldName = actionConfig.field as string | undefined;
        const fieldValue = actionConfig.value;
        if (!fieldName) return null;

        const updatePayload: Record<string, unknown> = {
          id: cardId,
          boardId,
          [fieldName]: fieldValue,
        };

        await this.cardsRepository.update(
          updatePayload as Parameters<CardsRepository['update']>[0],
        );

        return `definiu ${fieldName} em`;
      }

      case 'ASSIGN_USER': {
        const assigneeUserId = actionConfig.userId as string | undefined;
        if (!assigneeUserId) return null;

        await this.cardsRepository.update({
          id: cardId,
          boardId,
          assigneeId: assigneeUserId,
        });

        return 'atribuiu usuario em';
      }

      case 'ADD_LABEL': {
        const labelId = actionConfig.labelId as string | undefined;
        if (!labelId) return null;

        const cardWithLabels =
          await this.cardsRepository.findByIdWithLabels(cardId, boardId);
        if (!cardWithLabels) return null;

        const existingLabelIds = cardWithLabels.labelIds;
        if (existingLabelIds.includes(labelId)) {
          return null;
        }

        await this.cardsRepository.update({
          id: cardId,
          boardId,
          labelIds: [...existingLabelIds, labelId],
        });

        return 'adicionou etiqueta em';
      }

      case 'COMPLETE_CARD': {
        await this.cardsRepository.update({
          id: cardId,
          boardId,
          status: 'DONE',
          completedAt: new Date(),
        });

        return 'completou';
      }

      case 'SEND_NOTIFICATION': {
        // Stub: notification delivery is not yet implemented
        return null;
      }

      default:
        return null;
    }
  }
}
