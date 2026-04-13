import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface GetScheduleByIdUseCaseRequest {
  scheduleId: string;
  tenantId: string;
}

interface GetScheduleByIdUseCaseResponse {
  schedule: import('@/entities/production/schedule').ProductionSchedule;
}

export class GetScheduleByIdUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    scheduleId,
    tenantId,
  }: GetScheduleByIdUseCaseRequest): Promise<GetScheduleByIdUseCaseResponse> {
    const schedule = await this.schedulesRepository.findScheduleById(
      new UniqueEntityID(scheduleId),
      tenantId,
    );

    if (!schedule) {
      throw new ResourceNotFoundError('Schedule not found.');
    }

    return { schedule };
  }
}
