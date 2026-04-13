import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ProductionTimeEntry,
  ProductionTimeEntryType,
} from '@/entities/production/time-entry';

export interface CreateTimeEntrySchema {
  jobCardId: string;
  operatorId: string;
  startTime: Date;
  endTime?: Date;
  breakMinutes?: number;
  entryType?: ProductionTimeEntryType;
  notes?: string;
}

export interface UpdateTimeEntrySchema {
  id: UniqueEntityID;
  endTime?: Date | null;
  breakMinutes?: number;
  notes?: string | null;
}

export interface TimeEntriesRepository {
  create(data: CreateTimeEntrySchema): Promise<ProductionTimeEntry>;
  findById(id: UniqueEntityID): Promise<ProductionTimeEntry | null>;
  findManyByJobCardId(
    jobCardId: UniqueEntityID,
  ): Promise<ProductionTimeEntry[]>;
  update(data: UpdateTimeEntrySchema): Promise<ProductionTimeEntry | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
