import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTransaction } from '@/entities/sales/pos-transaction';
import { prisma } from '@/lib/prisma';
import { posTransactionPrismaToDomain } from '@/mappers/sales/pos-transaction/pos-transaction-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { PosTransactionStatus as PrismaStatus } from '@prisma/generated/client.js';
import type {
  FindManyPosTransactionsPaginatedParams,
  PosTransactionsRepository,
} from '../pos-transactions-repository';

export class PrismaPosTransactionsRepository
  implements PosTransactionsRepository
{
  async create(transaction: PosTransaction): Promise<void> {
    await prisma.posTransaction.create({
      data: {
        id: transaction.id.toString(),
        tenantId: transaction.tenantId.toString(),
        sessionId: transaction.sessionId.toString(),
        orderId: transaction.orderId.toString(),
        transactionNumber: transaction.transactionNumber,
        status: transaction.status as PrismaStatus,
        subtotal: transaction.subtotal,
        discountTotal: transaction.discountTotal,
        taxTotal: transaction.taxTotal,
        grandTotal: transaction.grandTotal,
        changeAmount: transaction.changeAmount,
        customerId: transaction.customerId?.toString() ?? null,
        customerName: transaction.customerName ?? null,
        customerDocument: transaction.customerDocument ?? null,
        overrideByUserId: transaction.overrideByUserId?.toString() ?? null,
        overrideReason: transaction.overrideReason ?? null,
        syncedAt: transaction.syncedAt ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTransaction | null> {
    const raw = await prisma.posTransaction.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? posTransactionPrismaToDomain(raw) : null;
  }

  async findByOrderId(
    orderId: string,
    tenantId: string,
  ): Promise<PosTransaction | null> {
    const raw = await prisma.posTransaction.findFirst({
      where: {
        orderId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return raw ? posTransactionPrismaToDomain(raw) : null;
  }

  async findManyPaginated(
    params: FindManyPosTransactionsPaginatedParams,
  ): Promise<PaginatedResult<PosTransaction>> {
    const where: Record<string, unknown> = { tenantId: params.tenantId };

    if (params.sessionId) where.sessionId = params.sessionId;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      prisma.posTransaction.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
        },
      }),
      prisma.posTransaction.count({ where }),
    ]);

    return {
      data: data.map(posTransactionPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async getNextTransactionNumber(sessionId: string): Promise<number> {
    const last = await prisma.posTransaction.findFirst({
      where: { sessionId },
      orderBy: { transactionNumber: 'desc' },
      select: { transactionNumber: true },
    });
    return (last?.transactionNumber ?? 0) + 1;
  }

  async save(transaction: PosTransaction): Promise<void> {
    await prisma.posTransaction.update({
      where: { id: transaction.id.toString() },
      data: {
        status: transaction.status as PrismaStatus,
        syncedAt: transaction.syncedAt ?? null,
      },
    });
  }
}
