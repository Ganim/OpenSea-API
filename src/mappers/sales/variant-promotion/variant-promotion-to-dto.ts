import type { VariantPromotion } from '@/entities/sales/variant-promotion';

export interface VariantPromotionDTO {
  id: string;
  variantId: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrentlyValid: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function variantPromotionToDTO(
  promotion: VariantPromotion,
): VariantPromotionDTO {
  return {
    id: promotion.id.toString(),
    variantId: promotion.variantId.toString(),
    name: promotion.name,
    discountType: promotion.discountType.value,
    discountValue: promotion.discountValue,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    isActive: promotion.isActive,
    isCurrentlyValid: promotion.isCurrentlyValid,
    isExpired: promotion.isExpired,
    isUpcoming: promotion.isUpcoming,
    notes: promotion.notes,
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
  };
}
