import { PrismaDiscountRulesRepository } from '@/repositories/sales/prisma/prisma-discount-rules-repository';
import { ListDiscountRulesUseCase } from '../list-discount-rules';

export function makeListDiscountRulesUseCase() {
  const discountRulesRepository = new PrismaDiscountRulesRepository();
  return new ListDiscountRulesUseCase(discountRulesRepository);
}
