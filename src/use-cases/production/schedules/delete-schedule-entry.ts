import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SchedulesRepository } from '@/repositories/production/schedules-repository';

interface DeleteScheduleEntryUseCaseRequest {
  id: string;
}

export class DeleteScheduleEntryUseCase {
  constructor(private schedulesRepository: SchedulesRepository) {}

  async execute({ id }: DeleteScheduleEntryUseCaseRequest): Promise<void> {
    const existing = await this.schedulesRepository.findEntryById(
      new UniqueEntityID(id),
    );

    if (!existing) {
      throw new ResourceNotFoundError('Schedule entry not found.');
    }

    await this.schedulesRepository.deleteEntry(new UniqueEntityID(id));
  }
}
