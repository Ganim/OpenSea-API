import { PrismaDiscountRulesRepository } from '@/repositories/sales/prisma/prisma-discount-rules-repository';
import { ValidateDiscountUseCase } from '../validate-discount';

export function makeValidateDiscountUseCase() {
  const discountRulesRepository = new PrismaDiscountRulesRepository();
  return new ValidateDiscountUseCase(discountRulesRepository);
}
