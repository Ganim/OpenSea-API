import { WorkSchedule } from '@/entities/hr/work-schedule';
import { WorkSchedulesRepository } from '@/repositories/hr/work-schedules-repository';

export interface ListWorkSchedulesRequest {
  activeOnly?: boolean;
}

export interface ListWorkSchedulesResponse {
  workSchedules: WorkSchedule[];
  total: number;
}

export class ListWorkSchedulesUseCase {
  constructor(private workSchedulesRepository: WorkSchedulesRepository) {}

  async execute(
    request: ListWorkSchedulesRequest,
  ): Promise<ListWorkSchedulesResponse> {
    const { activeOnly = false } = request;

    const workSchedules = activeOnly
      ? await this.workSchedulesRepository.findManyActive()
      : await this.workSchedulesRepository.findMany();

    return {
      workSchedules,
      total: workSchedules.length,
    };
  }
}
