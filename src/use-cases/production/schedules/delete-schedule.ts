import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface DeleteScheduleUseCaseRequest {
  scheduleId: string;
  tenantId: string;
}

export class DeleteScheduleUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({
    scheduleId,
    tenantId,
  }: DeleteScheduleUseCaseRequest): Promise<void> {
    const schedule = await this.schedulesRepository.findScheduleById(
      new UniqueEntityID(scheduleId),
      tenantId,
    );

    if (!schedule) {
      throw new ResourceNotFoundError('Schedule not found.');
    }

    await this.schedulesRepository.deleteSchedule(new UniqueEntityID(scheduleId));
  }
}
