import { PrismaDiscountRulesRepository } from '@/repositories/sales/prisma/prisma-discount-rules-repository';
import { GetDiscountRuleByIdUseCase } from '../get-discount-rule-by-id';

export function makeGetDiscountRuleByIdUseCase() {
  const discountRulesRepository = new PrismaDiscountRulesRepository();
  return new GetDiscountRuleByIdUseCase(discountRulesRepository);
}
