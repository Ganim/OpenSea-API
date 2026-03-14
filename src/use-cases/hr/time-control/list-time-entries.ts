import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import { TimeEntryType } from '@/entities/hr/value-objects';
import { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export interface ListTimeEntriesRequest {
  tenantId: string;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  entryType?: string;
  page?: number;
  perPage?: number;
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
    const { tenantId, employeeId, startDate, endDate, entryType, page, perPage } = request;

    // Aplicar default de 30 dias para evitar carregar histórico completo sem filtro
    const effectiveEndDate = endDate ?? new Date();
    const effectiveStartDate = startDate ?? new Date(effectiveEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await this.timeEntriesRepository.findMany({
      tenantId,
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      entryType: entryType ? this.mapEntryType(entryType) : undefined,
      page: page ?? 1,
      perPage: perPage ?? 50,
    });

    return result;
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
        throw new BadRequestError(`Invalid entry type: ${entryType}`);
    }
  }
}
