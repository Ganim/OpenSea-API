import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkSchedulesRepository } from '@/repositories/hr/work-schedules-repository';

export interface DeleteWorkScheduleRequest {
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
    const { id } = request;

    const workSchedule = await this.workSchedulesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!workSchedule) {
      throw new Error('Work schedule not found');
    }

    await this.workSchedulesRepository.delete(new UniqueEntityID(id));

    return {
      success: true,
    };
  }
}
