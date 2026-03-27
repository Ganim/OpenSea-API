import { PrismaBenefitPlansRepository } from '@/repositories/hr/prisma/prisma-benefit-plans-repository';
import { ListBenefitPlansUseCase } from '../list-benefit-plans';

export function makeListBenefitPlansUseCase() {
  const benefitPlansRepository = new PrismaBenefitPlansRepository();
  return new ListBenefitPlansUseCase(benefitPlansRepository);
}
