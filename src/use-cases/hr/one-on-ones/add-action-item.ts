import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { OneOnOneActionItemsRepository } from '@/repositories/hr/one-on-one-action-items-repository';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';

export interface AddActionItemRequest {
  tenantId: string;
  meetingId: string;
  authorEmployeeId: string;
  ownerId: string;
  content: string;
  dueDate?: Date;
}

export interface AddActionItemResponse {
  actionItem: OneOnOneActionItem;
}

export class AddActionItemUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private actionItemsRepository: OneOnOneActionItemsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: AddActionItemRequest): Promise<AddActionItemResponse> {
    const { tenantId, meetingId, authorEmployeeId, ownerId, content, dueDate } =
      request;

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      new UniqueEntityID(meetingId),
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    if (!meeting.isParticipant(new UniqueEntityID(authorEmployeeId))) {
      throw new ForbiddenError(
        'Apenas participantes da reunião 1:1 podem criar ações',
      );
    }

    const owner = await this.employeesRepository.findById(
      new UniqueEntityID(ownerId),
      tenantId,
    );

    if (!owner) {
      throw new ResourceNotFoundError('ActionItemOwner');
    }

    const actionItem = await this.actionItemsRepository.create({
      meetingId: meeting.id,
      ownerId: owner.id,
      content,
      dueDate,
    });

    return { actionItem };
  }
}
