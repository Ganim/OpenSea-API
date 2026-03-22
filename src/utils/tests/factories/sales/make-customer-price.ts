import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomerPrice } from '@/entities/sales/customer-price';
import { faker } from '@faker-js/faker';

interface MakeCustomerPriceProps {
  tenantId?: UniqueEntityID;
  customerId?: UniqueEntityID;
  variantId?: UniqueEntityID;
  price?: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
  createdByUserId?: UniqueEntityID;
  createdAt?: Date;
  updatedAt?: Date;
}

export function makeCustomerPrice(
  override: MakeCustomerPriceProps = {},
  id?: UniqueEntityID,
): CustomerPrice {
  const customerPrice = CustomerPrice.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      customerId: override.customerId ?? new UniqueEntityID(),
      variantId: override.variantId ?? new UniqueEntityID(),
      price:
        override.price ?? Number(faker.commerce.price({ min: 10, max: 1000 })),
      validFrom: override.validFrom,
      validUntil: override.validUntil,
      notes: override.notes,
      createdByUserId: override.createdByUserId ?? new UniqueEntityID(),
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
    },
    id ?? new UniqueEntityID(),
  );

  return customerPrice;
}
