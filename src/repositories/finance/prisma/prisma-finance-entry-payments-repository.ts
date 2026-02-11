import { prisma } from '@/lib/prisma';
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
  ): Promise<FinanceEntryPayment> {
    const payment = await prisma.financeEntryPayment.create({
      data: {
        entryId: data.entryId,
        bankAccountId: data.bankAccountId,
        amount: new Prisma.Decimal(data.amount),
        paidAt: data.paidAt,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
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

  async sumByEntryId(entryId: UniqueEntityID): Promise<number> {
    const result = await prisma.financeEntryPayment.aggregate({
      _sum: { amount: true },
      where: {
        entryId: entryId.toString(),
      },
    });

    return Number(result._sum?.amount ?? 0);
  }
}
