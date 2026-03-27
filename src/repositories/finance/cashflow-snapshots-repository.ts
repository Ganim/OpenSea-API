export interface CashflowSnapshotRecord {
  id: string;
  tenantId: string;
  date: Date;
  predictedInflow: number;
  predictedOutflow: number;
  actualInflow: number | null;
  actualOutflow: number | null;
  createdAt: Date;
}

export interface UpsertCashflowSnapshotSchema {
  tenantId: string;
  date: Date;
  predictedInflow: number;
  predictedOutflow: number;
  actualInflow?: number | null;
  actualOutflow?: number | null;
}

export interface CashflowSnapshotsRepository {
  upsert(data: UpsertCashflowSnapshotSchema): Promise<CashflowSnapshotRecord>;
  findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashflowSnapshotRecord[]>;
}
