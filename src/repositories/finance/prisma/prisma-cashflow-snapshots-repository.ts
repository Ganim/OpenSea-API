import { prisma } from '@/lib/prisma';
import type {
  CashflowSnapshotRecord,
  CashflowSnapshotsRepository,
  UpsertCashflowSnapshotSchema,
} from '../cashflow-snapshots-repository';

export class PrismaCashflowSnapshotsRepository
  implements CashflowSnapshotsRepository
{
  async upsert(
    data: UpsertCashflowSnapshotSchema,
  ): Promise<CashflowSnapshotRecord> {
    const row = await prisma.cashflowSnapshot.upsert({
      where: {
        tenantId_date: {
          tenantId: data.tenantId,
          date: data.date,
        },
      },
      create: {
        tenantId: data.tenantId,
        date: data.date,
        predictedInflow: data.predictedInflow,
        predictedOutflow: data.predictedOutflow,
        actualInflow: data.actualInflow ?? null,
        actualOutflow: data.actualOutflow ?? null,
      },
      update: {
        predictedInflow: data.predictedInflow,
        predictedOutflow: data.predictedOutflow,
        ...(data.actualInflow !== undefined && {
          actualInflow: data.actualInflow,
        }),
        ...(data.actualOutflow !== undefined && {
          actualOutflow: data.actualOutflow,
        }),
      },
    });

    return {
      id: row.id,
      tenantId: row.tenantId,
      date: row.date,
      predictedInflow: Number(row.predictedInflow),
      predictedOutflow: Number(row.predictedOutflow),
      actualInflow: row.actualInflow !== null ? Number(row.actualInflow) : null,
      actualOutflow:
        row.actualOutflow !== null ? Number(row.actualOutflow) : null,
      createdAt: row.createdAt,
    };
  }

  async findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashflowSnapshotRecord[]> {
    const rows = await prisma.cashflowSnapshot.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      date: row.date,
      predictedInflow: Number(row.predictedInflow),
      predictedOutflow: Number(row.predictedOutflow),
      actualInflow: row.actualInflow !== null ? Number(row.actualInflow) : null,
      actualOutflow:
        row.actualOutflow !== null ? Number(row.actualOutflow) : null,
      createdAt: row.createdAt,
    }));
  }
}
