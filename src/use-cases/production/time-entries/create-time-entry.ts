import type {
  ProductionTimeEntry,
  ProductionTimeEntryType,
} from '@/entities/production/time-entry';
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
  constructor(private timeEntriesRepository: TimeEntriesRepository) {}

  async execute({
    jobCardId,
    operatorId,
    startTime,
    endTime,
    breakMinutes,
    entryType,
    notes,
  }: CreateTimeEntryUseCaseRequest): Promise<CreateTimeEntryUseCaseResponse> {
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
