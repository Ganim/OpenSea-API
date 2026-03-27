import { randomUUID } from 'node:crypto';
import type {
  CashflowSnapshotRecord,
  CashflowSnapshotsRepository,
  UpsertCashflowSnapshotSchema,
} from '../cashflow-snapshots-repository';

export class InMemoryCashflowSnapshotsRepository
  implements CashflowSnapshotsRepository
{
  public items: CashflowSnapshotRecord[] = [];

  async upsert(
    data: UpsertCashflowSnapshotSchema,
  ): Promise<CashflowSnapshotRecord> {
    const dateKey = data.date.toISOString().split('T')[0];

    const existingIndex = this.items.findIndex(
      (item) =>
        item.tenantId === data.tenantId &&
        item.date.toISOString().split('T')[0] === dateKey,
    );

    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      const updated: CashflowSnapshotRecord = {
        ...existing,
        predictedInflow: data.predictedInflow,
        predictedOutflow: data.predictedOutflow,
        actualInflow: data.actualInflow ?? existing.actualInflow,
        actualOutflow: data.actualOutflow ?? existing.actualOutflow,
      };
      this.items[existingIndex] = updated;
      return updated;
    }

    const record: CashflowSnapshotRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      date: data.date,
      predictedInflow: data.predictedInflow,
      predictedOutflow: data.predictedOutflow,
      actualInflow: data.actualInflow ?? null,
      actualOutflow: data.actualOutflow ?? null,
      createdAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashflowSnapshotRecord[]> {
    return this.items
      .filter(
        (item) =>
          item.tenantId === tenantId &&
          item.date >= startDate &&
          item.date <= endDate,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
