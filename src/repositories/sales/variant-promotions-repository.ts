import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { VariantPromotion } from '@/entities/sales/variant-promotion';

export interface CreateVariantPromotionSchema {
  variantId: UniqueEntityID;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateVariantPromotionSchema {
  id: UniqueEntityID;
  name?: string;
  discountValue?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  notes?: string;
}

export interface VariantPromotionsRepository {
  create(data: CreateVariantPromotionSchema): Promise<VariantPromotion>;
  findById(id: UniqueEntityID): Promise<VariantPromotion | null>;
  findManyByVariant(variantId: UniqueEntityID): Promise<VariantPromotion[]>;
  findManyActive(): Promise<VariantPromotion[]>;
  findManyActiveByVariant(
    variantId: UniqueEntityID,
  ): Promise<VariantPromotion[]>;
  update(data: UpdateVariantPromotionSchema): Promise<VariantPromotion | null>;
  save(promotion: VariantPromotion): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
