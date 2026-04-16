import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { OneOnOneActionItemsRepository } from '@/repositories/hr/one-on-one-action-items-repository';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';

export interface UpdateActionItemRequest {
  tenantId: string;
  actionItemId: string;
  viewerEmployeeId: string;
  content?: string;
  ownerId?: string;
  dueDate?: Date | null;
  isCompleted?: boolean;
}

export interface UpdateActionItemResponse {
  actionItem: OneOnOneActionItem;
}

export class UpdateActionItemUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private actionItemsRepository: OneOnOneActionItemsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: UpdateActionItemRequest,
  ): Promise<UpdateActionItemResponse> {
    const {
      tenantId,
      actionItemId,
      viewerEmployeeId,
      content,
      ownerId,
      dueDate,
      isCompleted,
    } = request;

    const actionItem = await this.actionItemsRepository.findById(
      new UniqueEntityID(actionItemId),
    );

    if (!actionItem) {
      throw new ResourceNotFoundError('ActionItem');
    }

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      actionItem.meetingId,
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    const viewerIdVO = new UniqueEntityID(viewerEmployeeId);
    if (!meeting.isParticipant(viewerIdVO)) {
      throw new ForbiddenError(
        'Apenas participantes da reunião 1:1 podem atualizar ações',
      );
    }

    if (content !== undefined) {
      actionItem.content = content;
    }

    if (ownerId !== undefined) {
      const owner = await this.employeesRepository.findById(
        new UniqueEntityID(ownerId),
        tenantId,
      );

      if (!owner) {
        throw new ResourceNotFoundError('ActionItemOwner');
      }

      actionItem.ownerId = owner.id;
    }

    if (dueDate !== undefined) {
      actionItem.dueDate = dueDate ?? undefined;
    }

    if (isCompleted !== undefined) {
      actionItem.setCompleted(isCompleted);
    }

    await this.actionItemsRepository.save(actionItem);

    return { actionItem };
  }
}
