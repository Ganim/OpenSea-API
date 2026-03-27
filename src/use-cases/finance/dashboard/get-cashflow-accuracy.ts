import type { CashflowSnapshotsRepository } from '@/repositories/finance/cashflow-snapshots-repository';

interface GetCashflowAccuracyRequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
}

export interface CashflowAccuracyDataPoint {
  date: string; // YYYY-MM-DD
  predictedInflow: number;
  predictedOutflow: number;
  actualInflow: number | null;
  actualOutflow: number | null;
}

export interface CashflowAccuracyResponse {
  accuracy: number; // 0-100
  dataPoints: CashflowAccuracyDataPoint[];
  periodCount: number;
}

export class GetCashflowAccuracyUseCase {
  constructor(
    private cashflowSnapshotsRepository: CashflowSnapshotsRepository,
  ) {}

  async execute(
    request: GetCashflowAccuracyRequest,
  ): Promise<CashflowAccuracyResponse> {
    const { tenantId, startDate, endDate } = request;

    const snapshots = await this.cashflowSnapshotsRepository.findByDateRange(
      tenantId,
      startDate,
      endDate,
    );

    const dataPoints: CashflowAccuracyDataPoint[] = snapshots.map(
      (snapshot) => ({
        date: snapshot.date.toISOString().split('T')[0],
        predictedInflow: snapshot.predictedInflow,
        predictedOutflow: snapshot.predictedOutflow,
        actualInflow: snapshot.actualInflow,
        actualOutflow: snapshot.actualOutflow,
      }),
    );

    // Calculate accuracy from snapshots that have both predicted and actual values
    const comparableSnapshots = snapshots.filter(
      (snapshot) =>
        snapshot.actualInflow !== null && snapshot.actualOutflow !== null,
    );

    let accuracy = 0;

    if (comparableSnapshots.length > 0) {
      let totalError = 0;

      for (const snapshot of comparableSnapshots) {
        const predictedNet =
          snapshot.predictedInflow - snapshot.predictedOutflow;
        const actualNet = snapshot.actualInflow! - snapshot.actualOutflow!;

        const denominator = Math.max(Math.abs(actualNet), 1);
        const snapshotError = Math.abs(predictedNet - actualNet) / denominator;

        totalError += snapshotError;
      }

      const averageError = totalError / comparableSnapshots.length;
      accuracy = Math.max(0, Math.round((1 - averageError) * 100 * 100) / 100);
    }

    return {
      accuracy,
      dataPoints,
      periodCount: comparableSnapshots.length,
    };
  }
}
