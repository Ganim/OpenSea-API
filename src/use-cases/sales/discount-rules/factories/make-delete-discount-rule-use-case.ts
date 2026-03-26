import { PrismaDiscountRulesRepository } from '@/repositories/sales/prisma/prisma-discount-rules-repository';
import { DeleteDiscountRuleUseCase } from '../delete-discount-rule';

export function makeDeleteDiscountRuleUseCase() {
  const discountRulesRepository = new PrismaDiscountRulesRepository();
  return new DeleteDiscountRuleUseCase(discountRulesRepository);
}
