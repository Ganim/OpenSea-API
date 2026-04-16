import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';

export interface DeleteOneOnOneRequest {
  tenantId: string;
  meetingId: string;
  viewerEmployeeId: string;
  /** When true, bypass manager-only check (e.g. user has hr.one-on-ones.admin). */
  canAdmin?: boolean;
}

export class DeleteOneOnOneUseCase {
  constructor(private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository) {}

  async execute(request: DeleteOneOnOneRequest): Promise<void> {
    const { tenantId, meetingId, viewerEmployeeId, canAdmin = false } = request;

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      new UniqueEntityID(meetingId),
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    const viewerEmployeeIdVO = new UniqueEntityID(viewerEmployeeId);
    if (!canAdmin && !meeting.isManager(viewerEmployeeIdVO)) {
      throw new ForbiddenError('Apenas o gestor da reunião 1:1 pode removê-la');
    }

    meeting.softDelete();
    await this.oneOnOneMeetingsRepository.save(meeting);
  }
}
