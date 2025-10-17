import { PrismaVariantPromotionsRepository } from '@/repositories/sales/prisma/prisma-variant-promotions-repository';
import { GetVariantPromotionByIdUseCase } from '../get-variant-promotion-by-id';

export function makeGetVariantPromotionByIdUseCase() {
  const variantPromotionsRepository = new PrismaVariantPromotionsRepository();
  return new GetVariantPromotionByIdUseCase(variantPromotionsRepository);
}
