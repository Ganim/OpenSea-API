import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { financeEntryPaymentPrismaToDomain } from '@/mappers/finance/finance-entry-payment/finance-entry-payment-prisma-to-domain';
import { Prisma } from '@prisma/generated/client.js';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';
import type {
  FinanceEntryPaymentsRepository,
  CreateFinanceEntryPaymentSchema,
} from '../finance-entry-payments-repository';

export class PrismaFinanceEntryPaymentsRepository
  implements FinanceEntryPaymentsRepository
{
  async create(
    data: CreateFinanceEntryPaymentSchema,
    tx?: TransactionClient,
  ): Promise<FinanceEntryPayment> {
    const client = tx ?? prisma;
    const payment = await client.financeEntryPayment.create({
      data: {
        entryId: data.entryId,
        bankAccountId: data.bankAccountId,
        amount: new Prisma.Decimal(data.amount),
        paidAt: data.paidAt,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        createdBy: data.createdBy,
      },
    });

    return financeEntryPaymentPrismaToDomain(payment);
  }

  async findByEntryId(entryId: UniqueEntityID): Promise<FinanceEntryPayment[]> {
    const payments = await prisma.financeEntryPayment.findMany({
      where: {
        entryId: entryId.toString(),
      },
      orderBy: { paidAt: 'asc' },
    });

    return payments.map(financeEntryPaymentPrismaToDomain);
  }

  async findById(id: UniqueEntityID): Promise<FinanceEntryPayment | null> {
    const payment = await prisma.financeEntryPayment.findUnique({
      where: {
        id: id.toString(),
      },
    });

    if (!payment) return null;
    return financeEntryPaymentPrismaToDomain(payment);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    tx?: TransactionClient,
  ): Promise<FinanceEntryPayment | null> {
    const client = tx ?? prisma;
    const payment = await client.financeEntryPayment.findUnique({
      where: { idempotencyKey },
    });

    if (!payment) return null;
    return financeEntryPaymentPrismaToDomain(payment);
  }

  async sumByEntryId(
    entryId: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx ?? prisma;
    const result = await client.financeEntryPayment.aggregate({
      _sum: { amount: true },
      where: {
        entryId: entryId.toString(),
      },
    });

    return Number(result._sum?.amount ?? 0);
  }

  async sumSettledBetween(
    tenantId: string,
    from: Date,
    to: Date,
    entryType: 'RECEIVABLE' | 'PAYABLE',
    bankAccountId?: string,
  ): Promise<number> {
    const rows = await prisma.$queryRaw<Array<{ total: Prisma.Decimal | null }>>(
      bankAccountId
        ? Prisma.sql`
            SELECT COALESCE(SUM(p."amount"), 0) AS total
            FROM "finance_entry_payments" p
            JOIN "finance_entries" e ON e."id" = p."entry_id"
            WHERE e."tenant_id" = ${tenantId}
              AND e."deleted_at" IS NULL
              AND e."type" = ${entryType}::"FinanceEntryType"
              AND p."paid_at" >= ${from}
              AND p."paid_at" <= ${to}
              AND (
                p."bank_account_id" = ${bankAccountId}
                OR e."bank_account_id" = ${bankAccountId}
              )`
        : Prisma.sql`
            SELECT COALESCE(SUM(p."amount"), 0) AS total
            FROM "finance_entry_payments" p
            JOIN "finance_entries" e ON e."id" = p."entry_id"
            WHERE e."tenant_id" = ${tenantId}
              AND e."deleted_at" IS NULL
              AND e."type" = ${entryType}::"FinanceEntryType"
              AND p."paid_at" >= ${from}
              AND p."paid_at" <= ${to}`,
    );

    const total = rows[0]?.total ?? 0;
    return Number(total);
  }
}
