import type { Combo } from '@/entities/sales/combo';

export interface ComboItemDTO {
  id: string;
  productId?: string;
  variantId?: string;
  categoryId?: string;
  quantity: number;
  sortOrder: number;
}

export interface ComboDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  items: ComboItemDTO[];
  categoryIds: string[];
  minItems?: number;
  maxItems?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function comboToDTO(combo: Combo): ComboDTO {
  const dto: ComboDTO = {
    id: combo.comboId.toString(),
    tenantId: combo.tenantId.toString(),
    name: combo.name,
    type: combo.type,
    discountType: combo.discountType,
    discountValue: combo.discountValue,
    isActive: combo.isActive,
    items: combo.items.map((item) => ({
      id: item.id.toString(),
      productId: item.productId?.toString(),
      variantId: item.variantId?.toString(),
      categoryId: item.categoryId?.toString(),
      quantity: item.quantity,
      sortOrder: item.sortOrder,
    })),
    categoryIds: combo.categoryIds,
    createdAt: combo.createdAt,
    updatedAt: combo.updatedAt,
  };

  if (combo.description) dto.description = combo.description;
  if (combo.startDate) dto.startDate = combo.startDate;
  if (combo.endDate) dto.endDate = combo.endDate;
  if (combo.minItems !== undefined) dto.minItems = combo.minItems;
  if (combo.maxItems !== undefined) dto.maxItems = combo.maxItems;

  return dto;
}
