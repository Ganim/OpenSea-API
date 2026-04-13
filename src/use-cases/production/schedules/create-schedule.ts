import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface CreateScheduleUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

interface CreateScheduleUseCaseResponse {
  schedule: import('@/entities/production/schedule').ProductionSchedule;
}

export class CreateScheduleUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    tenantId,
    name,
    description,
    startDate,
    endDate,
  }: CreateScheduleUseCaseRequest): Promise<CreateScheduleUseCaseResponse> {
    const schedule = await this.schedulesRepository.createSchedule({
      tenantId,
      name,
      description,
      startDate,
      endDate,
    });

    return { schedule };
  }
}
