import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import { prisma } from '@/lib/prisma';
import { orderPrismaToDomain } from '@/mappers/sales/order/order-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyOrdersPaginatedParams,
  OrdersRepository,
} from '../orders-repository';
import type {
  OrderType as PrismaOrderType,
  OrderChannel as PrismaOrderChannel,
} from '@prisma/generated/client.js';

export class PrismaOrdersRepository implements OrdersRepository {
  async create(order: Order): Promise<void> {
    await prisma.order.create({
      data: {
        id: order.id.toString(),
        tenantId: order.tenantId.toString(),
        orderNumber: order.orderNumber,
        type: order.type as PrismaOrderType,
        customerId: order.customerId.toString(),
        contactId: order.contactId?.toString() ?? null,
        pipelineId: order.pipelineId.toString(),
        stageId: order.stageId.toString(),
        channel: order.channel as PrismaOrderChannel,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        taxTotal: order.taxTotal,
        shippingTotal: order.shippingTotal,
        grandTotal: order.grandTotal,
        currency: order.currency,
        priceTableId: order.priceTableId?.toString() ?? null,
        paymentConditionId: order.paymentConditionId?.toString() ?? null,
        creditUsed: order.creditUsed,
        paidAmount: order.paidAmount,
        remainingAmount: order.remainingAmount,
        deliveryMethod: order.deliveryMethod as never,
        deliveryAddress: order.deliveryAddress as never,
        trackingCode: order.trackingCode ?? null,
        carrierName: order.carrierName ?? null,
        estimatedDelivery: order.estimatedDelivery ?? null,
        needsApproval: order.needsApproval,
        sourceWarehouseId: order.sourceWarehouseId?.toString() ?? null,
        assignedToUserId: order.assignedToUserId?.toString() ?? null,
        dealId: order.dealId?.toString() ?? null,
        quoteId: order.quoteId?.toString() ?? null,
        returnOriginId: order.returnOriginId?.toString() ?? null,
        couponId: order.couponId?.toString() ?? null,
        notes: order.notes ?? null,
        internalNotes: order.internalNotes ?? null,
        tags: order.tags,
        customFields: order.customFields as never,
        stageEnteredAt: order.stageEnteredAt,
        expiresAt: order.expiresAt ?? null,
        createdAt: order.createdAt,
      },
    });
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Order | null> {
    const data = await prisma.order.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return orderPrismaToDomain(data);
  }

  async findByNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<Order | null> {
    const data = await prisma.order.findFirst({
      where: {
        orderNumber,
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return orderPrismaToDomain(data);
  }

  async findManyPaginated(
    params: FindManyOrdersPaginatedParams,
  ): Promise<PaginatedResult<Order>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.type) where.type = params.type;
    if (params.channel) where.channel = params.channel;
    if (params.stageId) where.stageId = params.stageId;
    if (params.pipelineId) where.pipelineId = params.pipelineId;
    if (params.customerId) where.customerId = params.customerId;
    if (params.assignedToUserId)
      where.assignedToUserId = params.assignedToUserId;
    if (params.search) {
      where.orderNumber = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: where as never,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.order.count({ where: where as never }),
    ]);

    return {
      data: data.map((d) => orderPrismaToDomain(d)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(order: Order): Promise<void> {
    await prisma.order.update({
      where: { id: order.id.toString() },
      data: {
        type: order.type as PrismaOrderType,
        contactId: order.contactId?.toString() ?? null,
        stageId: order.stageId.toString(),
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        taxTotal: order.taxTotal,
        shippingTotal: order.shippingTotal,
        grandTotal: order.grandTotal,
        paymentConditionId: order.paymentConditionId?.toString() ?? null,
        creditUsed: order.creditUsed,
        paidAmount: order.paidAmount,
        remainingAmount: order.remainingAmount,
        deliveryMethod: order.deliveryMethod as never,
        needsApproval: order.needsApproval,
        approvedByUserId: order.approvedByUserId?.toString() ?? null,
        approvedAt: order.approvedAt ?? null,
        assignedToUserId: order.assignedToUserId?.toString() ?? null,
        notes: order.notes ?? null,
        internalNotes: order.internalNotes ?? null,
        tags: order.tags,
        stageEnteredAt: order.stageEnteredAt,
        confirmedAt: order.confirmedAt ?? null,
        cancelledAt: order.cancelledAt ?? null,
        cancelReason: order.cancelReason ?? null,
        deletedAt: order.deletedAt ?? null,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.order.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async getNextOrderNumber(tenantId: string): Promise<string> {
    const lastOrder = await prisma.order.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    if (!lastOrder) return 'ORD-0001';

    const match = lastOrder.orderNumber.match(/ORD-(\d+)/);
    if (!match) return 'ORD-0001';

    const nextNum = parseInt(match[1], 10) + 1;
    return `ORD-${String(nextNum).padStart(4, '0')}`;
  }
}
