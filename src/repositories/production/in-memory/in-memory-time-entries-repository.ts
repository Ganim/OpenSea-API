import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionTimeEntry } from '@/entities/production/time-entry';
import type { ProductionTimeEntryType } from '@/entities/production/time-entry';
import type {
  TimeEntriesRepository,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
} from '../time-entries-repository';

export class InMemoryTimeEntriesRepository implements TimeEntriesRepository {
  public items: ProductionTimeEntry[] = [];

  async create(data: CreateTimeEntrySchema): Promise<ProductionTimeEntry> {
    const timeEntry = ProductionTimeEntry.create({
      jobCardId: new UniqueEntityID(data.jobCardId),
      operatorId: new UniqueEntityID(data.operatorId),
      startTime: data.startTime,
      endTime: data.endTime ?? null,
      breakMinutes: data.breakMinutes ?? 0,
      entryType: (data.entryType as ProductionTimeEntryType) ?? 'PRODUCTION',
      notes: data.notes ?? null,
    });

    this.items.push(timeEntry);
    return timeEntry;
  }

  async findById(id: UniqueEntityID): Promise<ProductionTimeEntry | null> {
    const timeEntry = this.items.find(
      (item) => item.timeEntryId.toString() === id.toString(),
    );

    return timeEntry ?? null;
  }

  async findManyByJobCardId(
    jobCardId: UniqueEntityID,
  ): Promise<ProductionTimeEntry[]> {
    return this.items.filter(
      (item) => item.jobCardId.toString() === jobCardId.toString(),
    );
  }

  async update(
    data: UpdateTimeEntrySchema,
  ): Promise<ProductionTimeEntry | null> {
    const index = this.items.findIndex(
      (item) => item.timeEntryId.toString() === data.id.toString(),
    );

    if (index === -1) return null;

    const timeEntry = this.items[index];

    if (data.endTime !== undefined) timeEntry.endTime = data.endTime;
    if (data.breakMinutes !== undefined)
      timeEntry.breakMinutes = data.breakMinutes;
    if (data.notes !== undefined) timeEntry.notes = data.notes;

    this.items[index] = timeEntry;
    return timeEntry;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => item.timeEntryId.toString() !== id.toString(),
    );
  }
}
