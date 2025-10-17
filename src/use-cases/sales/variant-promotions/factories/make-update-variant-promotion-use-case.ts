import { PrismaVariantPromotionsRepository } from '@/repositories/sales/prisma/prisma-variant-promotions-repository';
import { UpdateVariantPromotionUseCase } from '../update-variant-promotion';

export function makeUpdateVariantPromotionUseCase() {
  const variantPromotionsRepository = new PrismaVariantPromotionsRepository();
  return new UpdateVariantPromotionUseCase(variantPromotionsRepository);
}
