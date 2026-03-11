import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkSchedulesRepository } from '@/repositories/hr/work-schedules-repository';

export interface DeleteWorkScheduleRequest {
  tenantId: string;
  id: string;
}

export interface DeleteWorkScheduleResponse {
  success: boolean;
}

export class DeleteWorkScheduleUseCase {
  constructor(private workSchedulesRepository: WorkSchedulesRepository) {}

  async execute(
    request: DeleteWorkScheduleRequest,
  ): Promise<DeleteWorkScheduleResponse> {
    const { tenantId, id } = request;

    const workSchedule = await this.workSchedulesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workSchedule) {
      throw new ResourceNotFoundError('Work schedule not found');
    }

    await this.workSchedulesRepository.delete(new UniqueEntityID(id));

    return {
      success: true,
    };
  }
}
