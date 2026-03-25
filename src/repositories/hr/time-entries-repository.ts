import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeEntry } from '@/entities/hr/time-entry';
import type { TimeEntryType } from '@/entities/hr/value-objects';

export interface CreateTimeEntrySchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  entryType: TimeEntryType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
  nsrNumber?: number;
}

export interface FindTimeEntriesFilters {
  tenantId: string;
  employeeId?: UniqueEntityID;
  startDate?: Date;
  endDate?: Date;
  entryType?: TimeEntryType;
  page?: number;
  perPage?: number;
}

export interface FindManyTimeEntriesResult {
  timeEntries: TimeEntry[];
  total: number;
}

export interface TimeEntriesRepository {
  create(data: CreateTimeEntrySchema): Promise<TimeEntry>;
  findById(id: UniqueEntityID, tenantId: string): Promise<TimeEntry | null>;
  findMany(filters: FindTimeEntriesFilters): Promise<FindManyTimeEntriesResult>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry[]>;
  findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeEntry[]>;
  findLastEntryByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null>;
  delete(id: UniqueEntityID): Promise<void>;
  findMaxNsrNumber(tenantId: string): Promise<number>;
}
