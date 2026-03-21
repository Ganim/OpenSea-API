import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PriceTable } from '@/entities/sales/price-table';
import { faker } from '@faker-js/faker';

interface MakePriceTableProps {
  tenantId?: UniqueEntityID;
  name?: string;
  description?: string;
  type?: string;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makePriceTable(
  override: MakePriceTableProps = {},
  id?: UniqueEntityID,
): PriceTable {
  const priceTable = PriceTable.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      name: override.name ?? faker.commerce.productName(),
      description: override.description,
      type: override.type ?? 'DEFAULT',
      currency: override.currency ?? 'BRL',
      priceIncludesTax: override.priceIncludesTax ?? true,
      isDefault: override.isDefault ?? false,
      priority: override.priority ?? 0,
      isActive: override.isActive ?? true,
      validFrom: override.validFrom,
      validUntil: override.validUntil,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    id ?? new UniqueEntityID(),
  );

  return priceTable;
}
