import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import { prisma } from '@/lib/prisma';
import { orderPrismaToDomain } from '@/mappers/sales/order/order-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindCashierQueueParams,
  FindManyOrdersPaginatedParams,
  OrdersRepository,
} from '../orders-repository';
import type {
  OrderType as PrismaOrderType,
  OrderChannel as PrismaOrderChannel,
  OrderStatus as PrismaOrderStatus,
} from '@prisma/generated/client.js';

export class PrismaOrdersRepository implements OrdersRepository {
  async create(order: Order): Promise<void> {
    const tenantId = order.tenantId.toString();
    const MAX_ATTEMPTS = 10;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const orderNumber =
        attempt === 0
          ? order.orderNumber
          : await this.generateOrderNumber(tenantId);

      try {
        await this.createWithOrderNumber(order, orderNumber);
        if (attempt > 0) {
          // Sync the regenerated number back to the in-memory entity
          (
            order as unknown as { props: { orderNumber: string } }
          ).props.orderNumber = orderNumber;
        }
        return;
      } catch (err) {
        // Any P2002 on this create is treated as an orderNumber collision.
        // Order IDs are UUIDs (astronomical collision chance), so P2002 here
        // is effectively always the (tenant_id, order_number) composite constraint.
        // meta.target shape varies across Prisma versions (string constraint name
        // vs array of fields), so we don't inspect it — we just retry.
        const isUniqueConflict =
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code: string }).code === 'P2002';

        if (!isUniqueConflict || attempt === MAX_ATTEMPTS - 1) {
          throw err;
        }
        // Retry with a freshly generated number
      }
    }
  }

  private async createWithOrderNumber(
    order: Order,
    orderNumber: string,
  ): Promise<void> {
    await prisma.order.create({
      data: {
        id: order.id.toString(),
        tenantId: order.tenantId.toString(),
        orderNumber,
        type: order.type as PrismaOrderType,
        status: order.status as PrismaOrderStatus,
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
        saleCode: order.saleCode ?? null,
        cashierUserId: order.cashierUserId?.toString() ?? null,
        posSessionId: order.posSessionId?.toString() ?? null,
        claimedByUserId: order.claimedByUserId?.toString() ?? null,
        claimedAt: order.claimedAt ?? null,
        version: order.version,
        notes: order.notes ?? null,
        internalNotes: order.internalNotes ?? null,
        tags: order.tags,
        customFields: order.customFields as never,
        stageEnteredAt: order.stageEnteredAt,
        expiresAt: order.expiresAt ?? null,
        createdAt: order.createdAt,
        // Emporion (Plan A — Tasks 5 + 21.5 + 28) — POS origin metadata.
        // The mapper / use case populate these for terminal-originated sales;
        // they are nullable for legacy WEB / API / MOBILE flows.
        originSource: order.originSource.value,
        posTerminalId: order.posTerminalId ?? null,
        posOperatorEmployeeId: order.posOperatorEmployeeId ?? null,
        saleLocalUuid: order.saleLocalUuid ?? null,
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

  async findBySaleCode(
    saleCode: string,
    tenantId: string,
  ): Promise<Order | null> {
    const data = await prisma.order.findFirst({
      where: {
        saleCode,
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return orderPrismaToDomain(data);
  }

  async findBySaleLocalUuid(
    saleLocalUuid: string,
    tenantId: string,
  ): Promise<Order | null> {
    const data = await prisma.order.findFirst({
      where: {
        saleLocalUuid,
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return orderPrismaToDomain(data);
  }

  async findCashierQueue(
    tenantId: string,
    params: FindCashierQueueParams,
  ): Promise<PaginatedResult<Order>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const CLAIM_EXPIRY_MS = 5 * 60 * 1000;
    const claimExpiryThreshold = new Date(Date.now() - CLAIM_EXPIRY_MS);

    const where: Record<string, unknown> = {
      tenantId,
      channel: 'PDV',
      status: 'PENDING',
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { saleCode: { contains: params.search, mode: 'insensitive' } },
        {
          customer: { name: { contains: params.search, mode: 'insensitive' } },
        },
      ];
    }

    if (params.terminalId) {
      where.terminalId = params.terminalId;
    } else if (params.terminalIds && params.terminalIds.length > 0) {
      where.terminalId = { in: params.terminalIds };
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: where as never,
        select: {
          id: true,
          tenantId: true,
          orderNumber: true,
          type: true,
          status: true,
          customerId: true,
          contactId: true,
          pipelineId: true,
          stageId: true,
          channel: true,
          subtotal: true,
          discountTotal: true,
          taxTotal: true,
          shippingTotal: true,
          grandTotal: true,
          currency: true,
          priceTableId: true,
          paymentConditionId: true,
          creditUsed: true,
          paidAmount: true,
          remainingAmount: true,
          deliveryMethod: true,
          deliveryAddress: true,
          trackingCode: true,
          carrierName: true,
          estimatedDelivery: true,
          deliveredAt: true,
          needsApproval: true,
          approvedByUserId: true,
          approvedAt: true,
          approvalNotes: true,
          rejectedReason: true,
          dealId: true,
          quoteId: true,
          returnOriginId: true,
          couponId: true,
          sourceWarehouseId: true,
          assignedToUserId: true,
          saleCode: true,
          cashierUserId: true,
          posSessionId: true,
          claimedByUserId: true,
          claimedAt: true,
          version: true,
          notes: true,
          internalNotes: true,
          tags: true,
          customFields: true,
          stageEnteredAt: true,
          confirmedAt: true,
          cancelledAt: true,
          cancelReason: true,
          expiresAt: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: where as never }),
    ]);

    const ordersWithExpiredClaims = data.map((orderData) => {
      if (orderData.claimedAt && orderData.claimedAt < claimExpiryThreshold) {
        return { ...orderData, claimedByUserId: null, claimedAt: null };
      }
      return orderData;
    });

    return {
      data: ordersWithExpiredClaims.map((d) => orderPrismaToDomain(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMyDrafts(
    userId: string,
    tenantId: string,
    params: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Order>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where = {
      assignedToUserId: userId,
      status: 'DRAFT' as const,
      channel: 'PDV' as const,
      tenantId,
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: data.map((d) => orderPrismaToDomain(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async generateOrderNumber(tenantId: string): Promise<string> {
    // Fetch all PDV-prefixed numbers and compute max numerically.
    // Lexicographic ordering would incorrectly rank 'PDV-9' > 'PDV-00010'
    // if both formats coexist (e.g. seed data vs app-generated).
    const pdvOrders = await prisma.order.findMany({
      where: {
        tenantId,
        orderNumber: { startsWith: 'PDV-' },
      },
      select: { orderNumber: true },
    });

    let maxNumber = 0;
    for (const o of pdvOrders) {
      const match = o.orderNumber.match(/^PDV-(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNumber) maxNumber = n;
      }
    }

    return `PDV-${String(maxNumber + 1).padStart(5, '0')}`;
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
        status: order.status as PrismaOrderStatus,
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
        saleCode: order.saleCode ?? null,
        cashierUserId: order.cashierUserId?.toString() ?? null,
        posSessionId: order.posSessionId?.toString() ?? null,
        claimedByUserId: order.claimedByUserId?.toString() ?? null,
        claimedAt: order.claimedAt ?? null,
        version: order.version,
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
