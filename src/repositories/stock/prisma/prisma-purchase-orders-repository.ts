import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { PurchaseOrder } from '@/entities/stock/purchase-order';
import { prisma } from '@/lib/prisma';
import { purchaseOrderPrismaToDomain } from '@/mappers/stock/purchase-order/purchase-order-prisma-to-domain';
import type { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreatePurchaseOrderSchema,
  PurchaseOrdersRepository,
  UpdatePurchaseOrderSchema,
} from '../purchase-orders-repository';

export class PrismaPurchaseOrdersRepository
  implements PurchaseOrdersRepository
{
  async create(data: CreatePurchaseOrderSchema): Promise<PurchaseOrder> {
    // Calculate total cost from items
    const totalCost = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: data.orderNumber,
        status: data.status.value as PrismaOrderStatus,
        supplierId: data.supplierId.toString(),
        createdBy: data.createdBy?.toString(),
        totalCost: new Decimal(totalCost),
        expectedDate: data.expectedDate,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId.toString(),
            quantity: new Decimal(item.quantity),
            unitCost: new Decimal(item.unitCost),
            totalCost: new Decimal(item.quantity * item.unitCost),
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return purchaseOrderPrismaToDomain(purchaseOrder);
  }

  async findById(id: UniqueEntityID): Promise<PurchaseOrder | null> {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: {
        id: id.toString(),
      },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) return null;

    return purchaseOrderPrismaToDomain(purchaseOrder);
  }

  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: {
        orderNumber,
      },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) return null;

    return purchaseOrderPrismaToDomain(purchaseOrder);
  }

  async findManyBySupplier(
    supplierId: UniqueEntityID,
    page: number,
    perPage: number,
  ): Promise<PurchaseOrder[]> {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: supplierId.toString(),
        deletedAt: null,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return purchaseOrders.map(purchaseOrderPrismaToDomain);
  }

  async findManyByStatus(
    status: OrderStatus,
    page: number,
    perPage: number,
  ): Promise<PurchaseOrder[]> {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: status.value as PrismaOrderStatus,
        deletedAt: null,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return purchaseOrders.map(purchaseOrderPrismaToDomain);
  }

  async update(data: UpdatePurchaseOrderSchema): Promise<PurchaseOrder | null> {
    try {
      const purchaseOrder = await prisma.purchaseOrder.update({
        where: {
          id: data.id.toString(),
        },
        data: {
          status: data.status?.value as PrismaOrderStatus | undefined,
          expectedDate: data.expectedDate,
          receivedDate: data.receivedDate,
          notes: data.notes,
        },
        include: {
          items: true,
        },
      });

      return purchaseOrderPrismaToDomain(purchaseOrder);
    } catch {
      return null;
    }
  }

  async save(order: PurchaseOrder): Promise<void> {
    await prisma.purchaseOrder.update({
      where: {
        id: order.id.toString(),
      },
      data: {
        status: order.status.value as PrismaOrderStatus,
        expectedDate: order.expectedDate,
        receivedDate: order.receivedDate,
        notes: order.notes,
        deletedAt: order.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.purchaseOrder.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
