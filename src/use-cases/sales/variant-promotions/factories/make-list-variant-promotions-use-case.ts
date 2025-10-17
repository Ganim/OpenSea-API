import { PrismaVariantPromotionsRepository } from '@/repositories/sales/prisma/prisma-variant-promotions-repository';
import { ListVariantPromotionsUseCase } from '../list-variant-promotions';

export function makeListVariantPromotionsUseCase() {
  const variantPromotionsRepository = new PrismaVariantPromotionsRepository();
  return new ListVariantPromotionsUseCase(variantPromotionsRepository);
}
