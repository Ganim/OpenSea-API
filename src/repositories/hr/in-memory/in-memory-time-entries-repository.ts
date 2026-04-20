import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntry } from '@/entities/hr/time-entry';
import type {
  CreateTimeEntrySchema,
  FindManyTimeEntriesResult,
  FindTimeEntriesFilters,
  TimeEntriesRepository,
} from '../time-entries-repository';

export class InMemoryTimeEntriesRepository implements TimeEntriesRepository {
  // Public to let specs assert on recorded entries and override fixtures
  // (e.g. prime a fake "already persisted with this requestId" row).
  public items: Array<TimeEntry & { requestId?: string }> = [];
  private nsrCounters: Map<string, number> = new Map();

  async create(data: CreateTimeEntrySchema): Promise<TimeEntry> {
    const id = new UniqueEntityID();
    const timeEntry = TimeEntry.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        employeeId: data.employeeId,
        entryType: data.entryType,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ipAddress,
        notes: data.notes,
        metadata: data.metadata ?? null,
      },
      id,
    );
    // Piggyback requestId as a side-property on the in-memory row so
    // findByRequestId can filter without extending the domain entity
    // (the real Prisma row carries the column, but the TimeEntry entity
    // does not — and we do not want to grow the entity just for tests).
    (timeEntry as TimeEntry & { requestId?: string }).requestId =
      data.requestId;

    if (data.nsrNumber != null) {
      const current = this.nsrCounters.get(data.tenantId) ?? 0;
      if (data.nsrNumber > current) {
        this.nsrCounters.set(data.tenantId, data.nsrNumber);
      }
    }

    this.items.push(timeEntry as TimeEntry & { requestId?: string });
    return timeEntry;
  }

  async createWithSequentialNsr(
    data: Omit<CreateTimeEntrySchema, 'nsrNumber'>,
  ): Promise<TimeEntry> {
    const next = (this.nsrCounters.get(data.tenantId) ?? 0) + 1;
    return this.create({ ...data, nsrNumber: next });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null> {
    const timeEntry = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return timeEntry || null;
  }

  async findMany(
    filters: FindTimeEntriesFilters,
  ): Promise<FindManyTimeEntriesResult> {
    let result = this.items.filter(
      (item) => item.tenantId.toString() === filters.tenantId,
    );

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

    result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = result.length;
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 50;
    const skip = (page - 1) * perPage;
    const timeEntries = result.slice(skip, skip + perPage);

    return { timeEntries, total };
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeEntry[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          item.timestamp >= startDate &&
          item.timestamp <= endDate,
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async findLastEntryByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null> {
    const entries = this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return entries[0] || null;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async findMaxNsrNumber(tenantId: string): Promise<number> {
    return this.nsrCounters.get(tenantId) ?? 0;
  }

  async findByRequestId(
    tenantId: string,
    employeeId: string,
    requestId: string,
  ): Promise<TimeEntry | null> {
    const match = this.items.find(
      (entry) =>
        entry.tenantId.toString() === tenantId &&
        entry.employeeId.toString() === employeeId &&
        (entry as TimeEntry & { requestId?: string }).requestId === requestId,
    );
    return match ?? null;
  }
}
