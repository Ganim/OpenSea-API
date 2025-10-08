import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder, SalesOrderItem } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { prisma } from '@/lib/prisma';
import { Prisma, type OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateSalesOrderSchema,
  SalesOrdersRepository,
  UpdateSalesOrderSchema,
} from '../sales-orders-repository';

export class PrismaSalesOrdersRepository implements SalesOrdersRepository {
  async create(data: CreateSalesOrderSchema): Promise<SalesOrder> {
    const orderData = await prisma.salesOrder.create({
      data: {
        orderNumber: data.orderNumber,
        customerId: data.customerId.toString(),
        createdBy: data.createdBy?.toString(),
        status: data.status.value as PrismaOrderStatus,
        discount: new Decimal(data.discount ?? 0),
        notes: data.notes,
        totalPrice: new Decimal(0), // Will be calculated from items
        finalPrice: new Decimal(0), // Will be calculated
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId.toString(),
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            discount: new Decimal(item.discount ?? 0),
            totalPrice: new Decimal(
              item.quantity * item.unitPrice - (item.discount ?? 0),
            ),
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Calculate totals
    const totalPrice = orderData.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    const finalPrice = totalPrice - Number(orderData.discount ?? 0);

    // Update with calculated values
    const updatedOrder = await prisma.salesOrder.update({
      where: { id: orderData.id },
      data: {
        totalPrice: new Decimal(totalPrice),
        finalPrice: new Decimal(finalPrice),
      },
      include: {
        items: true,
      },
    });

    return this.mapToDomain(updatedOrder);
  }

  async findById(id: UniqueEntityID): Promise<SalesOrder | null> {
    const orderData = await prisma.salesOrder.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!orderData) return null;

    return this.mapToDomain(orderData);
  }

  async findByOrderNumber(orderNumber: string): Promise<SalesOrder | null> {
    const orderData = await prisma.salesOrder.findFirst({
      where: {
        orderNumber,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!orderData) return null;

    return this.mapToDomain(orderData);
  }

  async findManyByCustomer(
    customerId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<SalesOrder[]> {
    const ordersData = await prisma.salesOrder.findMany({
      where: {
        customerId: customerId.toString(),
        deletedAt: null,
      },
      include: {
        items: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return ordersData.map((order) => this.mapToDomain(order));
  }

  async findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
  ): Promise<SalesOrder[]> {
    const ordersData = await prisma.salesOrder.findMany({
      where: {
        status: status.value as PrismaOrderStatus,
        deletedAt: null,
      },
      include: {
        items: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return ordersData.map((order) => this.mapToDomain(order));
  }

  async update(data: UpdateSalesOrderSchema): Promise<SalesOrder | null> {
    try {
      const orderData = await prisma.salesOrder.update({
        where: { id: data.id.toString() },
        data: {
          status: data.status?.value as PrismaOrderStatus | undefined,
          discount:
            data.discount !== undefined
              ? new Decimal(data.discount)
              : undefined,
          notes: data.notes,
        },
        include: {
          items: true,
        },
      });

      // Recalculate final price if discount changed
      if (data.discount !== undefined) {
        const totalPrice = Number(orderData.totalPrice);
        const finalPrice = totalPrice - data.discount;

        const updatedOrder = await prisma.salesOrder.update({
          where: { id: data.id.toString() },
          data: {
            finalPrice: new Decimal(finalPrice),
          },
          include: {
            items: true,
          },
        });

        return this.mapToDomain(updatedOrder);
      }

      return this.mapToDomain(orderData);
    } catch {
      return null;
    }
  }

  async save(order: SalesOrder): Promise<void> {
    await prisma.salesOrder.upsert({
      where: { id: order.id.toString() },
      create: {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId.toString(),
        createdBy: order.createdBy?.toString(),
        status: order.status.value as PrismaOrderStatus,
        totalPrice: new Decimal(order.totalPrice),
        discount: new Decimal(order.discount),
        finalPrice: new Decimal(order.finalPrice),
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? new Date(),
        deletedAt: order.deletedAt,
      },
      update: {
        status: order.status.value as PrismaOrderStatus,
        totalPrice: new Decimal(order.totalPrice),
        discount: new Decimal(order.discount),
        finalPrice: new Decimal(order.finalPrice),
        notes: order.notes,
        updatedAt: order.updatedAt ?? new Date(),
        deletedAt: order.deletedAt,
      },
    });

    // Save items separately
    for (const item of order.items) {
      await prisma.salesOrderItem.upsert({
        where: { id: item.id.toString() },
        create: {
          id: item.id.toString(),
          orderId: order.id.toString(),
          variantId: item.variantId.toString(),
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          discount: new Decimal(item.discount),
          totalPrice: new Decimal(item.totalPrice),
          notes: item.notes,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt ?? new Date(),
        },
        update: {
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          discount: new Decimal(item.discount),
          totalPrice: new Decimal(item.totalPrice),
          notes: item.notes,
          updatedAt: item.updatedAt ?? new Date(),
        },
      });
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.salesOrder.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private mapToDomain(
    orderData: Prisma.SalesOrderGetPayload<{ include: { items: true } }>,
  ): SalesOrder {
    type OrderItemData = Prisma.SalesOrderGetPayload<{
      include: { items: true };
    }>['items'][number];

    const items = orderData.items.map((itemData: OrderItemData) =>
      SalesOrderItem.create(
        {
          orderId: new EntityID(orderData.id),
          variantId: new EntityID(itemData.variantId),
          quantity: Number(itemData.quantity),
          unitPrice: Number(itemData.unitPrice),
          discount: Number(itemData.discount ?? 0),
          notes: itemData.notes ?? undefined,
          createdAt: itemData.createdAt,
          updatedAt: itemData.updatedAt,
        },
        new EntityID(itemData.id),
      ),
    );

    return SalesOrder.create(
      {
        orderNumber: orderData.orderNumber,
        customerId: new EntityID(orderData.customerId),
        createdBy: orderData.createdBy
          ? new EntityID(orderData.createdBy)
          : undefined,
        status: OrderStatus.create(orderData.status),
        discount: Number(orderData.discount ?? 0),
        notes: orderData.notes ?? undefined,
        items,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        deletedAt: orderData.deletedAt ?? undefined,
      },
      new EntityID(orderData.id),
    );
  }
}
