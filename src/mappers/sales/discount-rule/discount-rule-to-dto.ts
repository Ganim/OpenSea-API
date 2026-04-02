import type { DiscountRule } from '@/entities/sales/discount-rule';

export interface DiscountRuleDTO {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minOrderValue?: number;
  minQuantity?: number;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
  isStackable: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function discountRuleToDTO(discountRule: DiscountRule): DiscountRuleDTO {
  const dto: DiscountRuleDTO = {
    id: discountRule.id.toString(),
    name: discountRule.name,
    type: discountRule.type,
    value: discountRule.value,
    startDate: discountRule.startDate,
    endDate: discountRule.endDate,
    isActive: discountRule.isActive,
    priority: discountRule.priority,
    isStackable: discountRule.isStackable,
    createdAt: discountRule.createdAt,
  };

  if (discountRule.description) dto.description = discountRule.description;
  if (discountRule.minOrderValue !== undefined)
    dto.minOrderValue = discountRule.minOrderValue;
  if (discountRule.minQuantity !== undefined)
    dto.minQuantity = discountRule.minQuantity;
  if (discountRule.categoryId) dto.categoryId = discountRule.categoryId;
  if (discountRule.productId) dto.productId = discountRule.productId;
  if (discountRule.customerId) dto.customerId = discountRule.customerId;
  if (discountRule.updatedAt) dto.updatedAt = discountRule.updatedAt;

  return dto;
}
