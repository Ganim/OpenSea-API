import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TaxObligation, type TaxType } from '@/entities/finance/tax-obligation';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { TaxObligationStatus as PrismaTaxObligationStatus } from '@prisma/generated/client.js';
import type {
  CreateTaxObligationSchema,
  FindManyTaxObligationsOptions,
  FindManyTaxObligationsResult,
  TaxObligationsRepository,
} from '../tax-obligations-repository';

function getClient(tx?: TransactionClient) {
  return tx ?? prisma;
}

interface TaxObligationRow {
  id: string;
  tenantId: string;
  taxType: string;
  referenceMonth: number;
  referenceYear: number;
  dueDate: Date;
  amount: { toNumber(): number } | number;
  status: PrismaTaxObligationStatus;
  paidAt: Date | null;
  darfCode: string | null;
  entryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: TaxObligationRow): TaxObligation {
  const amount =
    typeof row.amount === 'number' ? row.amount : row.amount.toNumber();

  return TaxObligation.create(
    {
      tenantId: new UniqueEntityID(row.tenantId),
      taxType: row.taxType as TaxType,
      referenceMonth: row.referenceMonth,
      referenceYear: row.referenceYear,
      dueDate: row.dueDate,
      amount,
      status: row.status,
      paidAt: row.paidAt ?? undefined,
      darfCode: row.darfCode ?? undefined,
      entryId: row.entryId ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    new UniqueEntityID(row.id),
  );
}

export class PrismaTaxObligationsRepository
  implements TaxObligationsRepository
{
  async create(
    data: CreateTaxObligationSchema,
    tx?: TransactionClient,
  ): Promise<TaxObligation> {
    const client = getClient(tx);
    const row = await (client as typeof prisma).taxObligation.create({
      data: {
        tenantId: data.tenantId,
        taxType: data.taxType,
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        dueDate: data.dueDate,
        amount: data.amount,
        darfCode: data.darfCode,
      },
    });

    return toDomain(row);
  }

  async createMany(
    data: CreateTaxObligationSchema[],
    tx?: TransactionClient,
  ): Promise<TaxObligation[]> {
    const obligations: TaxObligation[] = [];
    for (const obligationData of data) {
      const obligation = await this.create(obligationData, tx);
      obligations.push(obligation);
    }
    return obligations;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TaxObligation | null> {
    const row = await prisma.taxObligation.findFirst({
      where: { id: id.toString(), tenantId },
    });

    return row ? toDomain(row) : null;
  }

  async findByTaxTypeAndPeriod(
    tenantId: string,
    taxType: TaxType,
    referenceMonth: number,
    referenceYear: number,
  ): Promise<TaxObligation | null> {
    const row = await prisma.taxObligation.findUnique({
      where: {
        tenantId_taxType_referenceMonth_referenceYear: {
          tenantId,
          taxType,
          referenceMonth,
          referenceYear,
        },
      },
    });

    return row ? toDomain(row) : null;
  }

  async findMany(
    options: FindManyTaxObligationsOptions,
  ): Promise<FindManyTaxObligationsResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Record<string, unknown> = { tenantId: options.tenantId };
    if (options.year !== undefined) where.referenceYear = options.year;
    if (options.month !== undefined) where.referenceMonth = options.month;
    if (options.status) where.status = options.status;
    if (options.taxType) where.taxType = options.taxType;

    const [rows, total] = await Promise.all([
      prisma.taxObligation.findMany({
        where,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.taxObligation.count({ where }),
    ]);

    return {
      obligations: rows.map(toDomain),
      total,
    };
  }

  async update(
    obligation: TaxObligation,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = getClient(tx);
    await (client as typeof prisma).taxObligation.update({
      where: { id: obligation.id.toString() },
      data: {
        status: obligation.status as PrismaTaxObligationStatus,
        paidAt: obligation.paidAt ?? null,
        entryId: obligation.entryId ?? null,
        amount: obligation.amount,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.taxObligation.delete({
      where: { id: id.toString(), tenantId },
    });
  }

  async sumPendingByYear(tenantId: string, year: number): Promise<number> {
    const result = await prisma.taxObligation.aggregate({
      where: { tenantId, referenceYear: year, status: 'PENDING' },
      _sum: { amount: true },
    });
    const amountSum = result._sum.amount;
    if (!amountSum) return 0;
    return typeof amountSum === 'number' ? amountSum : Number(amountSum);
  }
}
