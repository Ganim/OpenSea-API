import type { Prisma } from '@prisma/generated/client.js';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplaceOrder } from '@/entities/sales/marketplace-order';
import type { MarketplaceOrderStatusType } from '@/entities/sales/marketplace-order';
import { prisma } from '@/lib/prisma';
import type {
  CreateMarketplaceOrderSchema,
  MarketplaceOrdersRepository,
} from '../marketplace-orders-repository';
import type { MarketplaceOrderStatus as PrismaOrderStatus } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): MarketplaceOrder {
  return MarketplaceOrder.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      connectionId: new UniqueEntityID(data.connectionId as string),
      externalOrderId: data.externalOrderId as string,
      externalOrderUrl: (data.externalOrderUrl as string) ?? undefined,
      status: data.status as MarketplaceOrderStatusType,
      marketplaceStatus: (data.marketplaceStatus as string) ?? undefined,
      buyerName: data.buyerName as string,
      buyerDocument: (data.buyerDocument as string) ?? undefined,
      buyerEmail: (data.buyerEmail as string) ?? undefined,
      buyerPhone: (data.buyerPhone as string) ?? undefined,
      customerId: (data.customerId as string) ?? undefined,
      subtotal: Number(data.subtotal),
      shippingCost: Number(data.shippingCost),
      marketplaceFee: Number(data.marketplaceFee),
      netAmount: Number(data.netAmount),
      currency: data.currency as string,
      shippingMethod: (data.shippingMethod as string) ?? undefined,
      trackingCode: (data.trackingCode as string) ?? undefined,
      trackingUrl: (data.trackingUrl as string) ?? undefined,
      shippingLabel: (data.shippingLabel as string) ?? undefined,
      estimatedDelivery: (data.estimatedDelivery as Date) ?? undefined,
      shippedAt: (data.shippedAt as Date) ?? undefined,
      deliveredAt: (data.deliveredAt as Date) ?? undefined,
      deliveryAddress: (data.deliveryAddress as Record<string, unknown>) ?? {},
      orderId: (data.orderId as string) ?? undefined,
      notes: (data.notes as string) ?? undefined,
      receivedAt: data.receivedAt as Date,
      acknowledgedAt: (data.acknowledgedAt as Date) ?? undefined,
      processedAt: (data.processedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaMarketplaceOrdersRepository
  implements MarketplaceOrdersRepository
{
  async create(
    data: CreateMarketplaceOrderSchema,
  ): Promise<MarketplaceOrder> {
    const record = await prisma.marketplaceOrder.create({
      data: {
        tenantId: data.tenantId,
        connectionId: data.connectionId,
        externalOrderId: data.externalOrderId,
        externalOrderUrl: data.externalOrderUrl,
        status: (data.status ?? 'RECEIVED') as PrismaOrderStatus,
        buyerName: data.buyerName,
        buyerDocument: data.buyerDocument,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        customerId: data.customerId,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost ?? 0,
        marketplaceFee: data.marketplaceFee ?? 0,
        netAmount: data.netAmount,
        currency: data.currency ?? 'BRL',
        shippingMethod: data.shippingMethod,
        deliveryAddress: data.deliveryAddress as Prisma.InputJsonValue | undefined,
        receivedAt: data.receivedAt,
        notes: data.notes,
      },
    });

    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceOrder | null> {
    const record = await prisma.marketplaceOrder.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findByExternalId(
    connectionId: string,
    externalOrderId: string,
  ): Promise<MarketplaceOrder | null> {
    const record = await prisma.marketplaceOrder.findFirst({
      where: { connectionId, externalOrderId, deletedAt: null },
    });
    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceOrder[]> {
    const records = await prisma.marketplaceOrder.findMany({
      where: { connectionId, tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { receivedAt: 'desc' },
    });
    return records.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async findManyByTenant(
    page: number,
    perPage: number,
    tenantId: string,
    status?: MarketplaceOrderStatusType,
  ): Promise<MarketplaceOrder[]> {
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };
    if (status) where.status = status;

    const records = await prisma.marketplaceOrder.findMany({
      where: where as Prisma.MarketplaceOrderWhereInput,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { receivedAt: 'desc' },
    });
    return records.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async countByConnection(
    connectionId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.marketplaceOrder.count({
      where: { connectionId, tenantId, deletedAt: null },
    });
  }

  async countByTenant(
    tenantId: string,
    status?: MarketplaceOrderStatusType,
  ): Promise<number> {
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };
    if (status) where.status = status;

    return prisma.marketplaceOrder.count({
      where: where as Prisma.MarketplaceOrderWhereInput,
    });
  }

  async save(order: MarketplaceOrder): Promise<void> {
    await prisma.marketplaceOrder.update({
      where: { id: order.id.toString() },
      data: {
        status: order.status as PrismaOrderStatus,
        trackingCode: order.trackingCode,
        trackingUrl: order.trackingUrl,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        acknowledgedAt: order.acknowledgedAt,
        processedAt: order.processedAt,
        deletedAt: order.deletedAt,
        updatedAt: new Date(),
      },
    });
  }
}
