import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalesOrder, SalesOrderItem } from '@/entities/sales/sales-order';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { faker } from '@faker-js/faker';

interface MakeSalesOrderItemProps {
  orderId?: string;
  variantId?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MakeSalesOrderProps {
  orderNumber?: string;
  status?:
    | 'DRAFT'
    | 'PENDING'
    | 'CONFIRMED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURNED';
  customerId?: string;
  createdBy?: string;
  discount?: number;
  notes?: string;
  items?: MakeSalesOrderItemProps[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makeSalesOrderItem(
  override: MakeSalesOrderItemProps = {},
): SalesOrderItem {
  const item = SalesOrderItem.create(
    {
      orderId: override.orderId
        ? new UniqueEntityID(override.orderId)
        : new UniqueEntityID(),
      variantId: override.variantId
        ? new UniqueEntityID(override.variantId)
        : new UniqueEntityID(),
      quantity: override.quantity ?? faker.number.int({ min: 1, max: 10 }),
      unitPrice:
        override.unitPrice ??
        Number(faker.commerce.price({ min: 10, max: 1000 })),
      discount: override.discount ?? 0,
      notes: override.notes,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
    },
    new UniqueEntityID(),
  );

  return item;
}

export function makeSalesOrder(override: MakeSalesOrderProps = {}): SalesOrder {
  const items: SalesOrderItem[] = [];

  if (override.items) {
    for (const itemProps of override.items) {
      items.push(makeSalesOrderItem(itemProps));
    }
  }

  const order = SalesOrder.create(
    {
      orderNumber:
        override.orderNumber ??
        `SO-${faker.string.alphanumeric(10).toUpperCase()}`,
      status: override.status
        ? OrderStatus.create(override.status)
        : OrderStatus.PENDING(),
      customerId: override.customerId
        ? new UniqueEntityID(override.customerId)
        : new UniqueEntityID(),
      createdBy: override.createdBy
        ? new UniqueEntityID(override.createdBy)
        : undefined,
      discount: override.discount ?? 0,
      notes: override.notes,
      items,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return order;
}
