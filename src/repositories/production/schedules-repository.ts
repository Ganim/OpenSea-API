import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionSchedule } from '@/entities/production/schedule';
import type {
  ProductionScheduleEntry,
  ScheduleEntryStatus,
} from '@/entities/production/schedule-entry';

export interface CreateScheduleSchema {
  tenantId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateScheduleSchema {
  id: UniqueEntityID;
  name?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface CreateScheduleEntrySchema {
  scheduleId: string;
  productionOrderId?: string;
  workstationId?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  notes?: string;
}

export interface UpdateScheduleEntrySchema {
  id: UniqueEntityID;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  workstationId?: string | null;
  status?: ScheduleEntryStatus;
  color?: string | null;
  notes?: string | null;
}

export interface SchedulesRepository {
  // Schedule
  createSchedule(data: CreateScheduleSchema): Promise<ProductionSchedule>;
  findScheduleById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionSchedule | null>;
  findManySchedules(tenantId: string): Promise<ProductionSchedule[]>;
  deleteSchedule(id: UniqueEntityID): Promise<void>;

  // Schedule Entry
  createEntry(
    data: CreateScheduleEntrySchema,
  ): Promise<ProductionScheduleEntry>;
  findEntryById(id: UniqueEntityID): Promise<ProductionScheduleEntry | null>;
  findManyEntries(
    scheduleId: string,
    filters?: { startDate?: Date; endDate?: Date },
  ): Promise<ProductionScheduleEntry[]>;
  updateEntry(
    data: UpdateScheduleEntrySchema,
  ): Promise<ProductionScheduleEntry | null>;
  deleteEntry(id: UniqueEntityID): Promise<void>;
}
