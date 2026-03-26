import { PrismaDiscountRulesRepository } from '@/repositories/sales/prisma/prisma-discount-rules-repository';
import { CreateDiscountRuleUseCase } from '../create-discount-rule';

export function makeCreateDiscountRuleUseCase() {
  const discountRulesRepository = new PrismaDiscountRulesRepository();
  return new CreateDiscountRuleUseCase(discountRulesRepository);
}
