import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PriceTableItem } from '@/entities/sales/price-table-item';
import { faker } from '@faker-js/faker';

interface MakePriceTableItemProps {
  priceTableId?: UniqueEntityID;
  tenantId?: UniqueEntityID;
  variantId?: UniqueEntityID;
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  costPrice?: number;
  marginPercent?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function makePriceTableItem(
  override: MakePriceTableItemProps = {},
  id?: UniqueEntityID,
): PriceTableItem {
  const item = PriceTableItem.create(
    {
      priceTableId: override.priceTableId ?? new UniqueEntityID(),
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      variantId: override.variantId ?? new UniqueEntityID(),
      price: override.price ?? Number(faker.commerce.price({ min: 10, max: 1000 })),
      minQuantity: override.minQuantity ?? 1,
      maxQuantity: override.maxQuantity,
      costPrice: override.costPrice,
      marginPercent: override.marginPercent,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
    },
    id ?? new UniqueEntityID(),
  );

  return item;
}
