import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderItem, type PriceSourceType } from '@/entities/sales/order-item';
import { faker } from '@faker-js/faker';

interface MakeOrderItemProps {
  tenantId?: UniqueEntityID;
  orderId?: UniqueEntityID;
  variantId?: UniqueEntityID;
  name?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountValue?: number;
  priceSource?: PriceSourceType;
  position?: number;
  notes?: string;
}

export function makeOrderItem(override: MakeOrderItemProps = {}): OrderItem {
  return OrderItem.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      orderId: override.orderId ?? new UniqueEntityID(),
      variantId: override.variantId ?? new UniqueEntityID(),
      name: override.name ?? faker.commerce.productName(),
      sku: override.sku ?? faker.string.alphanumeric(8).toUpperCase(),
      quantity: override.quantity ?? faker.number.int({ min: 1, max: 20 }),
      unitPrice:
        override.unitPrice ??
        Number(faker.commerce.price({ min: 10, max: 500 })),
      discountPercent: override.discountPercent,
      discountValue: override.discountValue,
      priceSource: override.priceSource,
      position: override.position,
      notes: override.notes,
    },
    new UniqueEntityID(),
  );
}
