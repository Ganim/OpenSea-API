import { PrismaDiscountRulesRepository } from '@/repositories/sales/prisma/prisma-discount-rules-repository';
import { UpdateDiscountRuleUseCase } from '../update-discount-rule';

export function makeUpdateDiscountRuleUseCase() {
  const discountRulesRepository = new PrismaDiscountRulesRepository();
  return new UpdateDiscountRuleUseCase(discountRulesRepository);
}
