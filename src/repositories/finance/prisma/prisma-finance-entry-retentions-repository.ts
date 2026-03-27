import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { RetentionTaxType } from '@prisma/generated/client.js';
import type {
  CreateFinanceEntryRetentionSchema,
  FinanceEntryRetentionRecord,
  FinanceEntryRetentionsRepository,
} from '../finance-entry-retentions-repository';

function getClient(tx?: TransactionClient) {
  return tx ?? prisma;
}

function toRecord(row: {
  id: string;
  tenantId: string;
  entryId: string;
  taxType: RetentionTaxType;
  grossAmount: { toNumber(): number } | number;
  rate: { toNumber(): number } | number;
  amount: { toNumber(): number } | number;
  withheld: boolean;
  description: string | null;
  createdAt: Date;
}): FinanceEntryRetentionRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    entryId: row.entryId,
    taxType: row.taxType,
    grossAmount:
      typeof row.grossAmount === 'number'
        ? row.grossAmount
        : row.grossAmount.toNumber(),
    rate: typeof row.rate === 'number' ? row.rate : row.rate.toNumber(),
    amount: typeof row.amount === 'number' ? row.amount : row.amount.toNumber(),
    withheld: row.withheld,
    description: row.description,
    createdAt: row.createdAt,
  };
}

export class PrismaFinanceEntryRetentionsRepository
  implements FinanceEntryRetentionsRepository
{
  async createMany(
    data: CreateFinanceEntryRetentionSchema[],
    tx?: TransactionClient,
  ): Promise<FinanceEntryRetentionRecord[]> {
    const client = getClient(tx);
    const results: FinanceEntryRetentionRecord[] = [];

    for (const item of data) {
      const row = await (client as typeof prisma).financeEntryRetention.create({
        data: {
          tenantId: item.tenantId,
          entryId: item.entryId,
          taxType: item.taxType as RetentionTaxType,
          grossAmount: item.grossAmount,
          rate: item.rate,
          amount: item.amount,
          withheld: item.withheld ?? true,
          description: item.description,
        },
      });
      results.push(toRecord(row));
    }

    return results;
  }

  async findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<FinanceEntryRetentionRecord[]> {
    const rows = await prisma.financeEntryRetention.findMany({
      where: { entryId, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toRecord);
  }

  async findByEntryIds(
    entryIds: string[],
    tenantId: string,
  ): Promise<FinanceEntryRetentionRecord[]> {
    if (entryIds.length === 0) return [];

    const rows = await prisma.financeEntryRetention.findMany({
      where: { entryId: { in: entryIds }, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toRecord);
  }

  async deleteByEntryId(
    entryId: string,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = getClient(tx);
    const result = await (
      client as typeof prisma
    ).financeEntryRetention.deleteMany({
      where: { entryId, tenantId },
    });

    return result.count;
  }
}
