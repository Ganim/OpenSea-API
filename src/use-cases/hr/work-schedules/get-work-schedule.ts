import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkSchedule } from '@/entities/hr/work-schedule';
import { WorkSchedulesRepository } from '@/repositories/hr/work-schedules-repository';

export interface GetWorkScheduleRequest {
  id: string;
}

export interface GetWorkScheduleResponse {
  workSchedule: WorkSchedule;
}

export class GetWorkScheduleUseCase {
  constructor(private workSchedulesRepository: WorkSchedulesRepository) {}

  async execute(
    request: GetWorkScheduleRequest,
  ): Promise<GetWorkScheduleResponse> {
    const { id } = request;

    const workSchedule = await this.workSchedulesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!workSchedule) {
      throw new Error('Work schedule not found');
    }

    return {
      workSchedule,
    };
  }
}
