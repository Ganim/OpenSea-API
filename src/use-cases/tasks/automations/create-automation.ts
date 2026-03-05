import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardAutomationRecord,
  BoardAutomationsRepository,
} from '@/repositories/tasks/board-automations-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

const VALID_TRIGGERS = [
  'CARD_MOVED',
  'CARD_CREATED',
  'DUE_DATE_REACHED',
  'ALL_SUBTASKS_DONE',
  'FIELD_CHANGED',
] as const;

const VALID_ACTIONS = [
  'SET_FIELD',
  'MOVE_CARD',
  'ASSIGN_USER',
  'ADD_LABEL',
  'SEND_NOTIFICATION',
  'COMPLETE_CARD',
] as const;

export type AutomationTrigger = (typeof VALID_TRIGGERS)[number];
export type AutomationAction = (typeof VALID_ACTIONS)[number];

interface CreateAutomationRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  name: string;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  action: string;
  actionConfig: Record<string, unknown>;
}

interface CreateAutomationResponse {
  automation: BoardAutomationRecord;
}

export class CreateAutomationUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardAutomationsRepository: BoardAutomationsRepository,
  ) {}

  async execute(
    request: CreateAutomationRequest,
  ): Promise<CreateAutomationResponse> {
    const { tenantId, userId, boardId, name, trigger, triggerConfig, action, actionConfig } =
      request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (!VALID_TRIGGERS.includes(trigger as AutomationTrigger)) {
      throw new BadRequestError(
        `Invalid trigger: ${trigger}. Valid triggers: ${VALID_TRIGGERS.join(', ')}`,
      );
    }

    if (!VALID_ACTIONS.includes(action as AutomationAction)) {
      throw new BadRequestError(
        `Invalid action: ${action}. Valid actions: ${VALID_ACTIONS.join(', ')}`,
      );
    }

    const automation = await this.boardAutomationsRepository.create({
      boardId,
      name,
      isActive: true,
      trigger,
      triggerConfig,
      action,
      actionConfig,
      createdBy: userId,
    });

    return { automation };
  }
}
