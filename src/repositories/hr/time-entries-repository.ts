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
}

export interface FindTimeEntriesFilters {
  tenantId: string;
  employeeId?: UniqueEntityID;
  startDate?: Date;
  endDate?: Date;
  entryType?: TimeEntryType;
}

export interface TimeEntriesRepository {
  create(data: CreateTimeEntrySchema): Promise<TimeEntry>;
  findById(id: UniqueEntityID, tenantId: string): Promise<TimeEntry | null>;
  findMany(filters: FindTimeEntriesFilters): Promise<TimeEntry[]>;
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
}
