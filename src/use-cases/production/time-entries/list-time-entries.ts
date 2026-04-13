import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionTimeEntry } from '@/entities/production/time-entry';
import { TimeEntriesRepository } from '@/repositories/production/time-entries-repository';

interface ListTimeEntriesUseCaseRequest {
  jobCardId: string;
}

interface ListTimeEntriesUseCaseResponse {
  timeEntries: ProductionTimeEntry[];
}

export class ListTimeEntriesUseCase {
  constructor(private timeEntriesRepository: TimeEntriesRepository) {}

  async execute({
    jobCardId,
  }: ListTimeEntriesUseCaseRequest): Promise<ListTimeEntriesUseCaseResponse> {
    const timeEntries = await this.timeEntriesRepository.findManyByJobCardId(
      new UniqueEntityID(jobCardId),
    );

    return { timeEntries };
  }
}
