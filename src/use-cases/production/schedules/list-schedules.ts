import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface ListSchedulesUseCaseRequest {
  tenantId: string;
}

interface ListSchedulesUseCaseResponse {
  schedules: import('@/entities/production/schedule').ProductionSchedule[];
}

export class ListSchedulesUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    tenantId,
  }: ListSchedulesUseCaseRequest): Promise<ListSchedulesUseCaseResponse> {
    const schedules =
      await this.schedulesRepository.findManySchedules(tenantId);
    return { schedules };
  }
}
