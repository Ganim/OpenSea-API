import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { BoardAutomationsRepository } from '@/repositories/tasks/board-automations-repository';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardWatchersRepository } from '@/repositories/tasks/card-watchers-repository';
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
    private cardWatchersRepository: CardWatchersRepository,
    private notificationsRepository: NotificationsRepository,
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
          context.userId,
          card.title,
        );

        if (actionDescription) {
          await this.cardActivitiesRepository.create({
            cardId: context.cardId,
            boardId,
            userId: context.userId,
            type: 'AUTOMATION_TRIGGERED',
            description: `Automação '${automation.name}' ${actionDescription} o cartão ${card.title}`,
            metadata: {
              automationId: automation.id,
              automationName: automation.name,
              trigger,
              action: automation.action,
            },
          });

          executedCount++;
        }
      } catch (error) {
        console.error(
          `[Tasks] Automation ${automation.id} (${automation.name}) failed:`,
          error instanceof Error ? error.message : error,
        );
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
    userId: string,
    cardTitle: string,
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
        const ALLOWED_FIELDS = [
          'status',
          'priority',
          'assigneeId',
          'dueDate',
          'startDate',
          'coverColor',
          'estimatedMinutes',
        ];
        const fieldName = actionConfig.field as string | undefined;
        const fieldValue = actionConfig.value;
        if (!fieldName || !ALLOWED_FIELDS.includes(fieldName)) return null;

        await this.cardsRepository.update({
          id: cardId,
          boardId,
          [fieldName]: fieldValue,
        } as Parameters<CardsRepository['update']>[0]);

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

        return 'atribuiu usuário em';
      }

      case 'ADD_LABEL': {
        const labelId = actionConfig.labelId as string | undefined;
        if (!labelId) return null;

        const cardWithLabels = await this.cardsRepository.findByIdWithLabels(
          cardId,
          boardId,
        );
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
        const watchers = await this.cardWatchersRepository.findByCardId(cardId);

        if (watchers.length === 0) return null;

        const message =
          (actionConfig?.message as string) ??
          `Atividade no cartão "${cardTitle}"`;

        for (const watcher of watchers) {
          if (watcher.userId === userId) continue;

          await this.notificationsRepository.create({
            userId: new UniqueEntityID(watcher.userId),
            title: `Notificação: ${cardTitle}`,
            message,
            type: 'INFO',
            priority: 'NORMAL',
            channel: 'IN_APP',
            entityType: 'card',
            entityId: cardId,
            actionUrl: `/tasks/${boardId}?card=${cardId}`,
          });
        }

        return 'notificou observadores de';
      }

      default:
        return null;
    }
  }
}
