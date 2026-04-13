import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionDowntimeRecord } from '@/entities/production/downtime-record';

export interface CreateDowntimeRecordSchema {
  workstationId: string;
  downtimeReasonId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  reportedById: string;
  notes?: string;
}

export interface UpdateDowntimeRecordSchema {
  id: UniqueEntityID;
  endTime?: Date | null;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface DowntimeRecordsRepository {
  create(data: CreateDowntimeRecordSchema): Promise<ProductionDowntimeRecord>;
  findById(id: UniqueEntityID): Promise<ProductionDowntimeRecord | null>;
  findManyByWorkstationId(
    workstationId: UniqueEntityID,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProductionDowntimeRecord[]>;
  update(
    data: UpdateDowntimeRecordSchema,
  ): Promise<ProductionDowntimeRecord | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
