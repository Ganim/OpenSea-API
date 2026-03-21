import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderReturn } from '@/entities/sales/order-return';
import { prisma } from '@/lib/prisma';
import { orderReturnPrismaToDomain } from '@/mappers/sales/order-return/order-return-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyOrderReturnsPaginatedParams,
  OrderReturnsRepository,
} from '../order-returns-repository';
import type {
  ReturnType as PrismaReturnType,
  ReturnReason as PrismaReturnReason,
  ReturnStatus as PrismaReturnStatus,
  RefundMethod as PrismaRefundMethod,
} from '@prisma/generated/client.js';

export class PrismaOrderReturnsRepository implements OrderReturnsRepository {
  async create(orderReturn: OrderReturn): Promise<void> {
    await prisma.orderReturn.create({
      data: {
        id: orderReturn.id.toString(),
        tenantId: orderReturn.tenantId.toString(),
        orderId: orderReturn.orderId.toString(),
        returnNumber: orderReturn.returnNumber,
        type: orderReturn.type as PrismaReturnType,
        status: orderReturn.status as PrismaReturnStatus,
        reason: orderReturn.reason as PrismaReturnReason,
        reasonDetails: orderReturn.reasonDetails ?? null,
        refundMethod: (orderReturn.refundMethod as PrismaRefundMethod) ?? null,
        refundAmount: orderReturn.refundAmount,
        creditAmount: orderReturn.creditAmount,
        exchangeOrderId: orderReturn.exchangeOrderId?.toString() ?? null,
        requestedByUserId: orderReturn.requestedByUserId.toString(),
        notes: orderReturn.notes ?? null,
        createdAt: orderReturn.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderReturn | null> {
    const data = await prisma.orderReturn.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return orderReturnPrismaToDomain(data);
  }

  async findManyByOrder(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderReturn[]> {
    const items = await prisma.orderReturn.findMany({
      where: {
        orderId: orderId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((i) => orderReturnPrismaToDomain(i));
  }

  async findManyPaginated(
    params: FindManyOrderReturnsPaginatedParams,
  ): Promise<PaginatedResult<OrderReturn>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.status) where.status = params.status;
    if (params.orderId) where.orderId = params.orderId;
    if (params.search) {
      where.returnNumber = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.orderReturn.findMany({
        where: where as never,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orderReturn.count({ where: where as never }),
    ]);

    return {
      data: data.map((d) => orderReturnPrismaToDomain(d)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(orderReturn: OrderReturn): Promise<void> {
    await prisma.orderReturn.update({
      where: { id: orderReturn.id.toString() },
      data: {
        status: orderReturn.status as PrismaReturnStatus,
        approvedByUserId: orderReturn.approvedByUserId?.toString() ?? null,
        approvedAt: orderReturn.approvedAt ?? null,
        rejectedReason: orderReturn.rejectedReason ?? null,
        receivedAt: orderReturn.receivedAt ?? null,
        notes: orderReturn.notes ?? null,
        deletedAt: orderReturn.deletedAt ?? null,
      },
    });
  }

  async getNextReturnNumber(tenantId: string): Promise<string> {
    const lastReturn = await prisma.orderReturn.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { returnNumber: true },
    });

    if (!lastReturn) return 'RET-0001';

    const match = lastReturn.returnNumber.match(/RET-(\d+)/);
    if (!match) return 'RET-0001';

    const nextNum = parseInt(match[1], 10) + 1;
    return `RET-${String(nextNum).padStart(4, '0')}`;
  }
}
