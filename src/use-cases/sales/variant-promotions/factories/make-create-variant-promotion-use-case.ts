import { PrismaVariantPromotionsRepository } from '@/repositories/sales/prisma/prisma-variant-promotions-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { CreateVariantPromotionUseCase } from '../create-variant-promotion';

export function makeCreateVariantPromotionUseCase() {
  const variantPromotionsRepository = new PrismaVariantPromotionsRepository();
  const variantsRepository = new PrismaVariantsRepository();

  return new CreateVariantPromotionUseCase(
    variantPromotionsRepository,
    variantsRepository,
  );
}
