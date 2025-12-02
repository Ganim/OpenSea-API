import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import type {
  CreateTimeEntrySchema,
  FindTimeEntriesFilters,
  TimeEntriesRepository,
} from '../time-entries-repository';

export class InMemoryTimeEntriesRepository implements TimeEntriesRepository {
  private items: TimeEntry[] = [];

  async create(data: CreateTimeEntrySchema): Promise<TimeEntry> {
    const id = new UniqueEntityID();
    const timeEntry = TimeEntry.create(
      {
        employeeId: data.employeeId,
        entryType: data.entryType,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ipAddress,
        notes: data.notes,
      },
      id,
    );

    this.items.push(timeEntry);
    return timeEntry;
  }

  async findById(id: UniqueEntityID): Promise<TimeEntry | null> {
    const timeEntry = this.items.find((item) => item.id.equals(id));
    return timeEntry || null;
  }

  async findMany(filters?: FindTimeEntriesFilters): Promise<TimeEntry[]> {
    let result = [...this.items];

    if (filters?.employeeId) {
      result = result.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }

    if (filters?.startDate) {
      result = result.filter((item) => item.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      result = result.filter((item) => item.timestamp <= filters.endDate!);
    }

    if (filters?.entryType) {
      result = result.filter((item) =>
        item.entryType.equals(filters.entryType!),
      );
    }

    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<TimeEntry[]> {
    return this.items
      .filter((item) => item.employeeId.equals(employeeId))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeEntry[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.timestamp >= startDate &&
          item.timestamp <= endDate,
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async findLastEntryByEmployee(
    employeeId: UniqueEntityID,
  ): Promise<TimeEntry | null> {
    const entries = this.items
      .filter((item) => item.employeeId.equals(employeeId))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return entries[0] || null;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
