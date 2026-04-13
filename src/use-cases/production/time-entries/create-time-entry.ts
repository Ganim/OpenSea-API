import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ProductionTimeEntry,
  ProductionTimeEntryType,
} from '@/entities/production/time-entry';
import type { JobCardsRepository } from '@/repositories/production/job-cards-repository';
import { TimeEntriesRepository } from '@/repositories/production/time-entries-repository';

interface CreateTimeEntryUseCaseRequest {
  jobCardId: string;
  operatorId: string;
  startTime: Date;
  endTime?: Date;
  breakMinutes?: number;
  entryType?: ProductionTimeEntryType;
  notes?: string;
}

interface CreateTimeEntryUseCaseResponse {
  timeEntry: ProductionTimeEntry;
}

export class CreateTimeEntryUseCase {
  constructor(
    private timeEntriesRepository: TimeEntriesRepository,
    private jobCardsRepository: JobCardsRepository,
  ) {}

  async execute({
    jobCardId,
    operatorId,
    startTime,
    endTime,
    breakMinutes,
    entryType,
    notes,
  }: CreateTimeEntryUseCaseRequest): Promise<CreateTimeEntryUseCaseResponse> {
    const jobCard = await this.jobCardsRepository.findById(
      new UniqueEntityID(jobCardId),
    );

    if (!jobCard) {
      throw new ResourceNotFoundError('Job card not found.');
    }

    if (jobCard.status !== 'IN_PROGRESS') {
      throw new BadRequestError(
        'Job card must be IN_PROGRESS to register time entries.',
      );
    }

    if (endTime && endTime <= startTime) {
      throw new BadRequestError('End time must be after start time.');
    }

    const timeEntry = await this.timeEntriesRepository.create({
      jobCardId,
      operatorId,
      startTime,
      endTime,
      breakMinutes,
      entryType,
      notes,
    });

    return { timeEntry };
  }
}
