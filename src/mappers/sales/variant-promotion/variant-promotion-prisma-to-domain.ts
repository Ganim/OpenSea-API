import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import type { VariantPromotion as PrismaVariantPromotion } from '@prisma/client';

export function mapVariantPromotionPrismaToDomain(
  promotionDb: PrismaVariantPromotion,
) {
  return {
    id: new UniqueEntityID(promotionDb.id),
    variantId: new UniqueEntityID(promotionDb.variantId),
    name: promotionDb.name,
    discountType: DiscountType.create(promotionDb.discountType),
    discountValue: Number(promotionDb.discountValue),
    startDate: promotionDb.startDate,
    endDate: promotionDb.endDate,
    isActive: promotionDb.isActive,
    notes: promotionDb.notes ?? undefined,
    createdAt: promotionDb.createdAt,
    updatedAt: promotionDb.updatedAt,
  };
}

export function variantPromotionPrismaToDomain(
  promotionDb: PrismaVariantPromotion,
): VariantPromotion {
  return VariantPromotion.create(
    mapVariantPromotionPrismaToDomain(promotionDb),
    new UniqueEntityID(promotionDb.id),
  );
}
