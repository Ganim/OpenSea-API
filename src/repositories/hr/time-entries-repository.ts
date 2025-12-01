import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeEntry } from '@/entities/hr/time-entry';
import type { TimeEntryType } from '@/entities/hr/value-objects';

export interface CreateTimeEntrySchema {
  employeeId: UniqueEntityID;
  entryType: TimeEntryType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
}

export interface FindTimeEntriesFilters {
  employeeId?: UniqueEntityID;
  startDate?: Date;
  endDate?: Date;
  entryType?: TimeEntryType;
}

export interface TimeEntriesRepository {
  create(data: CreateTimeEntrySchema): Promise<TimeEntry>;
  findById(id: UniqueEntityID): Promise<TimeEntry | null>;
  findMany(filters?: FindTimeEntriesFilters): Promise<TimeEntry[]>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<TimeEntry[]>;
  findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeEntry[]>;
  findLastEntryByEmployee(employeeId: UniqueEntityID): Promise<TimeEntry | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
