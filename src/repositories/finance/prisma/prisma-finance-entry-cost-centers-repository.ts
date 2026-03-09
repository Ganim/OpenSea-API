import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntryCostCenter } from '@/entities/finance/finance-entry-cost-center';
import type {
  FinanceEntryCostCentersRepository,
  CreateFinanceEntryCostCenterItem,
} from '../finance-entry-cost-centers-repository';

export class PrismaFinanceEntryCostCentersRepository
  implements FinanceEntryCostCentersRepository
{
  async createMany(
    data: CreateFinanceEntryCostCenterItem[],
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;

    await client.financeEntryCostCenter.createMany({
      data: data.map((item) => ({
        entryId: item.entryId,
        costCenterId: item.costCenterId,
        percentage: item.percentage,
        amount: item.amount,
      })),
    });
  }

  async findByEntryId(entryId: string): Promise<FinanceEntryCostCenter[]> {
    const records = await prisma.financeEntryCostCenter.findMany({
      where: { entryId },
    });

    return records.map((r) =>
      FinanceEntryCostCenter.create(
        {
          entryId: new UniqueEntityID(r.entryId),
          costCenterId: new UniqueEntityID(r.costCenterId),
          percentage: Number(r.percentage),
          amount: Number(r.amount),
          createdAt: r.createdAt,
        },
        new UniqueEntityID(r.id),
      ),
    );
  }

  async deleteByEntryId(
    entryId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;

    await client.financeEntryCostCenter.deleteMany({
      where: { entryId },
    });
  }
}
