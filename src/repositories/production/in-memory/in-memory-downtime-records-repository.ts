import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionDowntimeRecord } from '@/entities/production/downtime-record';
import type {
  CreateDowntimeRecordSchema,
  DowntimeRecordsRepository,
  UpdateDowntimeRecordSchema,
} from '../downtime-records-repository';

export class InMemoryDowntimeRecordsRepository
  implements DowntimeRecordsRepository
{
  public items: ProductionDowntimeRecord[] = [];

  async create(
    data: CreateDowntimeRecordSchema,
  ): Promise<ProductionDowntimeRecord> {
    const record = ProductionDowntimeRecord.create({
      workstationId: new EntityID(data.workstationId),
      downtimeReasonId: new EntityID(data.downtimeReasonId),
      startTime: data.startTime,
      endTime: data.endTime ?? null,
      durationMinutes: data.durationMinutes ?? null,
      reportedById: new EntityID(data.reportedById),
      notes: data.notes ?? null,
    });

    this.items.push(record);
    return record;
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionDowntimeRecord | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findManyByWorkstationId(
    workstationId: UniqueEntityID,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProductionDowntimeRecord[]> {
    let results = this.items.filter(
      (i) => i.workstationId.toString() === workstationId.toString(),
    );

    if (startDate) {
      results = results.filter((i) => i.startTime >= startDate);
    }
    if (endDate) {
      results = results.filter((i) => i.startTime <= endDate);
    }

    return results.sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );
  }

  async update(
    data: UpdateDowntimeRecordSchema,
  ): Promise<ProductionDowntimeRecord | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.endTime !== undefined) item.endTime = data.endTime;
    if (data.durationMinutes !== undefined)
      item.durationMinutes = data.durationMinutes;
    if (data.notes !== undefined) item.notes = data.notes;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
