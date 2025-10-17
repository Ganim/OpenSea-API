import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from '@/entities/stock/purchase-order';
import type {
  PurchaseOrder as PrismaPurchaseOrder,
  PurchaseOrderItem as PrismaPurchaseOrderItem,
} from '@prisma/client';

type PurchaseOrderWithItems = PrismaPurchaseOrder & {
  items: PrismaPurchaseOrderItem[];
};

export function purchaseOrderPrismaToDomain(
  orderDb: PurchaseOrderWithItems,
): PurchaseOrder {
  const items = orderDb.items.map((itemDb) =>
    PurchaseOrderItem.create(
      {
        id: new UniqueEntityID(itemDb.id),
        orderId: new UniqueEntityID(itemDb.orderId),
        variantId: new UniqueEntityID(itemDb.variantId),
        quantity: itemDb.quantity.toNumber(),
        unitCost: itemDb.unitCost.toNumber(),
        totalCost: itemDb.totalCost.toNumber(),
        notes: itemDb.notes ?? undefined,
        createdAt: itemDb.createdAt,
        updatedAt: itemDb.updatedAt ?? undefined,
      },
      new UniqueEntityID(itemDb.id),
    ),
  );

  return PurchaseOrder.create(
    {
      id: new UniqueEntityID(orderDb.id),
      orderNumber: orderDb.orderNumber,
      status: OrderStatus.create(orderDb.status),
      supplierId: new UniqueEntityID(orderDb.supplierId),
      createdBy: orderDb.createdBy
        ? new UniqueEntityID(orderDb.createdBy)
        : undefined,
      totalCost: orderDb.totalCost.toNumber(),
      expectedDate: orderDb.expectedDate ?? undefined,
      receivedDate: orderDb.receivedDate ?? undefined,
      notes: orderDb.notes ?? undefined,
      items,
      createdAt: orderDb.createdAt,
      updatedAt: orderDb.updatedAt ?? undefined,
      deletedAt: orderDb.deletedAt ?? undefined,
    },
    new UniqueEntityID(orderDb.id),
  );
}
