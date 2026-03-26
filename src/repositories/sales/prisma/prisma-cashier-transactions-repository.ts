import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { CashierTransaction } from '@/entities/sales/cashier-transaction';
import { prisma } from '@/lib/prisma';
import type { CashierTransactionType } from '@prisma/generated/client.js';
import type {
  CashierTransactionsRepository,
  CreateCashierTransactionSchema,
} from '../cashier-transactions-repository';

function mapToDomain(data: Record<string, unknown>): CashierTransaction {
  return CashierTransaction.create(
    {
      sessionId: new EntityID(data.sessionId as string),
      type: data.type as 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT',
      amount: Number(data.amount),
      description: (data.description as string) ?? undefined,
      paymentMethod: (data.paymentMethod as string) ?? undefined,
      referenceId: (data.referenceId as string) ?? undefined,
      createdAt: data.createdAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaCashierTransactionsRepository
  implements CashierTransactionsRepository
{
  async create(
    data: CreateCashierTransactionSchema,
  ): Promise<CashierTransaction> {
    const transactionData = await prisma.cashierTransaction.create({
      data: {
        sessionId: data.sessionId,
        type: data.type as CashierTransactionType,
        amount: data.amount,
        description: data.description,
        paymentMethod: data.paymentMethod,
        referenceId: data.referenceId,
      },
    });

    return mapToDomain(transactionData as unknown as Record<string, unknown>);
  }

  async findBySessionId(
    sessionId: UniqueEntityID,
  ): Promise<CashierTransaction[]> {
    const transactionsData = await prisma.cashierTransaction.findMany({
      where: { sessionId: sessionId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return transactionsData.map((transactionData) =>
      mapToDomain(transactionData as unknown as Record<string, unknown>),
    );
  }

  async findMany(
    page: number,
    perPage: number,
    sessionId: UniqueEntityID,
  ): Promise<CashierTransaction[]> {
    const transactionsData = await prisma.cashierTransaction.findMany({
      where: { sessionId: sessionId.toString() },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return transactionsData.map((transactionData) =>
      mapToDomain(transactionData as unknown as Record<string, unknown>),
    );
  }

  async countBySessionId(sessionId: UniqueEntityID): Promise<number> {
    return prisma.cashierTransaction.count({
      where: { sessionId: sessionId.toString() },
    });
  }
}
