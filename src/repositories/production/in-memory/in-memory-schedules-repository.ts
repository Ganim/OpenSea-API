import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionSchedule } from '@/entities/production/schedule';
import type { ScheduleEntryStatus } from '@/entities/production/schedule-entry';
import { ProductionScheduleEntry } from '@/entities/production/schedule-entry';
import type {
  CreateScheduleSchema,
  CreateScheduleEntrySchema,
  SchedulesRepository,
  UpdateScheduleEntrySchema,
} from '../schedules-repository';

export class InMemorySchedulesRepository implements SchedulesRepository {
  public schedules: ProductionSchedule[] = [];
  public entries: ProductionScheduleEntry[] = [];

  // Schedule
  async createSchedule(
    data: CreateScheduleSchema,
  ): Promise<ProductionSchedule> {
    const schedule = ProductionSchedule.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      description: data.description ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    this.schedules.push(schedule);
    return schedule;
  }

  async findScheduleById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionSchedule | null> {
    const item = this.schedules.find(
      (s) => s.id.equals(id) && s.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findManySchedules(tenantId: string): Promise<ProductionSchedule[]> {
    return this.schedules.filter((s) => s.tenantId.toString() === tenantId);
  }

  async deleteSchedule(id: UniqueEntityID): Promise<void> {
    const index = this.schedules.findIndex((s) => s.id.equals(id));
    if (index >= 0) {
      this.schedules.splice(index, 1);
    }
    // Also delete related entries
    this.entries = this.entries.filter(
      (e) => e.scheduleId.toString() !== id.toString(),
    );
  }

  // Schedule Entry
  async createEntry(
    data: CreateScheduleEntrySchema,
  ): Promise<ProductionScheduleEntry> {
    const entry = ProductionScheduleEntry.create({
      scheduleId: new EntityID(data.scheduleId),
      productionOrderId: data.productionOrderId
        ? new EntityID(data.productionOrderId)
        : null,
      workstationId: data.workstationId
        ? new EntityID(data.workstationId)
        : null,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color ?? null,
      notes: data.notes ?? null,
    });

    this.entries.push(entry);
    return entry;
  }

  async findEntryById(
    id: UniqueEntityID,
  ): Promise<ProductionScheduleEntry | null> {
    const item = this.entries.find((e) => e.id.equals(id));
    return item ?? null;
  }

  async findManyEntries(
    scheduleId: string,
    filters?: { startDate?: Date; endDate?: Date },
  ): Promise<ProductionScheduleEntry[]> {
    let results = this.entries.filter(
      (e) => e.scheduleId.toString() === scheduleId,
    );

    if (filters?.startDate) {
      results = results.filter((e) => e.startDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter((e) => e.endDate <= filters.endDate!);
    }

    return results;
  }

  async updateEntry(
    data: UpdateScheduleEntrySchema,
  ): Promise<ProductionScheduleEntry | null> {
    const item = this.entries.find((e) => e.id.equals(data.id));
    if (!item) return null;

    if (data.title !== undefined) item.title = data.title;
    if (data.startDate !== undefined) item.startDate = data.startDate;
    if (data.endDate !== undefined) item.endDate = data.endDate;
    if (data.workstationId !== undefined)
      item.workstationId = data.workstationId
        ? new EntityID(data.workstationId)
        : null;
    if (data.status !== undefined)
      item.status = data.status as ScheduleEntryStatus;
    if (data.color !== undefined) item.color = data.color;
    if (data.notes !== undefined) item.notes = data.notes;

    return item;
  }

  async deleteEntry(id: UniqueEntityID): Promise<void> {
    const index = this.entries.findIndex((e) => e.id.equals(id));
    if (index >= 0) {
      this.entries.splice(index, 1);
    }
  }
}
