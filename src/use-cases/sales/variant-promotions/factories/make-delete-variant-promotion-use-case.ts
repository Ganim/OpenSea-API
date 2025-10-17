import { PrismaVariantPromotionsRepository } from '@/repositories/sales/prisma/prisma-variant-promotions-repository';
import { DeleteVariantPromotionUseCase } from '../delete-variant-promotion';

export function makeDeleteVariantPromotionUseCase() {
  const variantPromotionsRepository = new PrismaVariantPromotionsRepository();
  return new DeleteVariantPromotionUseCase(variantPromotionsRepository);
}
