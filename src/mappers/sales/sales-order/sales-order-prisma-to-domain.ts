import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder, SalesOrderItem } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import type { Prisma } from '@prisma/generated/client.js';

export function mapSalesOrderPrismaToDomain(
  orderDb: Prisma.SalesOrderGetPayload<{ include: { items: true } }>,
) {
  const items = orderDb.items.map((itemDb) =>
    SalesOrderItem.create(
      {
        orderId: new UniqueEntityID(orderDb.id),
        variantId: new UniqueEntityID(itemDb.variantId),
        quantity: Number(itemDb.quantity),
        unitPrice: Number(itemDb.unitPrice),
        discount: Number(itemDb.discount ?? 0),
        notes: itemDb.notes ?? undefined,
        createdAt: itemDb.createdAt,
        updatedAt: itemDb.updatedAt,
      },
      new UniqueEntityID(itemDb.id),
    ),
  );

  return {
    id: new UniqueEntityID(orderDb.id),
    tenantId: new UniqueEntityID(orderDb.tenantId),
    orderNumber: orderDb.orderNumber,
    customerId: new UniqueEntityID(orderDb.customerId),
    createdBy: orderDb.createdBy
      ? new UniqueEntityID(orderDb.createdBy)
      : undefined,
    status: OrderStatus.create(orderDb.status),
    discount: Number(orderDb.discount ?? 0),
    notes: orderDb.notes ?? undefined,
    items,
    createdAt: orderDb.createdAt,
    updatedAt: orderDb.updatedAt,
    deletedAt: orderDb.deletedAt ?? undefined,
  };
}

export function salesOrderPrismaToDomain(
  orderDb: Prisma.SalesOrderGetPayload<{ include: { items: true } }>,
): SalesOrder {
  return SalesOrder.create(
    mapSalesOrderPrismaToDomain(orderDb),
    new UniqueEntityID(orderDb.id),
  );
}
