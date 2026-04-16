import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneActionItemsRepository } from '@/repositories/hr/one-on-one-action-items-repository';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';

export interface DeleteActionItemRequest {
  tenantId: string;
  actionItemId: string;
  viewerEmployeeId: string;
}

export class DeleteActionItemUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private actionItemsRepository: OneOnOneActionItemsRepository,
  ) {}

  async execute(request: DeleteActionItemRequest): Promise<void> {
    const { tenantId, actionItemId, viewerEmployeeId } = request;

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

    if (!meeting.isParticipant(new UniqueEntityID(viewerEmployeeId))) {
      throw new ForbiddenError(
        'Apenas participantes da reunião 1:1 podem remover ações',
      );
    }

    await this.actionItemsRepository.delete(actionItem.id);
  }
}
