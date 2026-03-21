import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Combo, type ComboItemProps } from '@/entities/sales/combo';

export function comboPrismaToDomain(
  record: {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    type: string;
    discountType: string;
    discountValue: number | { toNumber(): number };
    isActive: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    minItems?: number | null;
    maxItems?: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  },
  items?: {
    id: string;
    comboId: string;
    productId: string | null;
    variantId: string | null;
    categoryId: string | null;
    quantity: number;
    sortOrder: number;
    createdAt: Date;
  }[],
): Combo {
  const comboItems: ComboItemProps[] = (items ?? []).map((i) => ({
    id: new UniqueEntityID(i.id),
    comboId: new UniqueEntityID(i.comboId),
    productId: i.productId ? new UniqueEntityID(i.productId) : undefined,
    variantId: i.variantId ? new UniqueEntityID(i.variantId) : undefined,
    categoryId: i.categoryId ? new UniqueEntityID(i.categoryId) : undefined,
    quantity: i.quantity,
    sortOrder: i.sortOrder,
    createdAt: i.createdAt,
  }));

  return Combo.create(
    {
      tenantId: new UniqueEntityID(record.tenantId),
      name: record.name,
      description: record.description ?? undefined,
      type: record.type as Combo['type'],
      discountType: record.discountType as Combo['discountType'],
      discountValue:
        typeof record.discountValue === 'number'
          ? record.discountValue
          : record.discountValue.toNumber(),
      isActive: record.isActive,
      startDate: record.startDate ?? undefined,
      endDate: record.endDate ?? undefined,
      items: comboItems,
      minItems: record.minItems ?? undefined,
      maxItems: record.maxItems ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt ?? undefined,
    },
    new UniqueEntityID(record.id),
  );
}
