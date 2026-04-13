import type { ProductionScheduleEntry } from '@/entities/production/schedule-entry';
import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface ListScheduleEntriesUseCaseRequest {
  scheduleId: string;
  startDate?: Date;
  endDate?: Date;
}

interface ListScheduleEntriesUseCaseResponse {
  entries: ProductionScheduleEntry[];
}

export class ListScheduleEntriesUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    scheduleId,
    startDate,
    endDate,
  }: ListScheduleEntriesUseCaseRequest): Promise<ListScheduleEntriesUseCaseResponse> {
    const entries = await this.schedulesRepository.findManyEntries(scheduleId, {
      startDate,
      endDate,
    });

    return { entries };
  }
}
