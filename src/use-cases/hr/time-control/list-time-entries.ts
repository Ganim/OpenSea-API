import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface ListTimeEntriesRequest {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  entryType?: string;
}

export interface ListTimeEntriesResponse {
  timeEntries: TimeEntry[];
  total: number;
}

export class ListTimeEntriesUseCase {
  constructor(private timeEntriesRepository: TimeEntriesRepository) {}

  async execute(
    request: ListTimeEntriesRequest,
  ): Promise<ListTimeEntriesResponse> {
    const { employeeId, startDate, endDate, entryType } = request;

    const timeEntries = await this.timeEntriesRepository.findMany({
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      startDate,
      endDate,
      entryType: entryType ? this.mapEntryType(entryType) : undefined,
    });

    return {
      timeEntries,
      total: timeEntries.length,
    };
  }

  private mapEntryType(entryType: string): TimeEntryType {
    switch (entryType.toUpperCase()) {
      case 'CLOCK_IN':
        return TimeEntryType.CLOCK_IN();
      case 'CLOCK_OUT':
        return TimeEntryType.CLOCK_OUT();
      case 'BREAK_START':
        return TimeEntryType.BREAK_START();
      case 'BREAK_END':
        return TimeEntryType.BREAK_END();
      case 'OVERTIME_START':
        return TimeEntryType.OVERTIME_START();
      case 'OVERTIME_END':
        return TimeEntryType.OVERTIME_END();
      default:
        throw new Error(`Invalid entry type: ${entryType}`);
    }
  }
}
