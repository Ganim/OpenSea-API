import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionTimeEntry } from '@/entities/production/time-entry';
import { TimeEntriesRepository } from '@/repositories/production/time-entries-repository';

interface EndTimeEntryUseCaseRequest {
  id: string;
  endTime?: Date;
}

interface EndTimeEntryUseCaseResponse {
  timeEntry: ProductionTimeEntry;
}

export class EndTimeEntryUseCase {
  constructor(private timeEntriesRepository: TimeEntriesRepository) {}

  async execute({
    id,
    endTime,
  }: EndTimeEntryUseCaseRequest): Promise<EndTimeEntryUseCaseResponse> {
    const timeEntry = await this.timeEntriesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!timeEntry) {
      throw new ResourceNotFoundError('Time entry not found.');
    }

    if (timeEntry.endTime) {
      throw new BadRequestError('This time entry has already been ended.');
    }

    const resolvedEndTime = endTime ?? new Date();
    timeEntry.end(resolvedEndTime);

    const updated = await this.timeEntriesRepository.update({
      id: timeEntry.timeEntryId,
      endTime: timeEntry.endTime,
    });

    return { timeEntry: updated! };
  }
}
