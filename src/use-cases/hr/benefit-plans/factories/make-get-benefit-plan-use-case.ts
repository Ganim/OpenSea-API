import { PrismaBenefitPlansRepository } from '@/repositories/hr/prisma/prisma-benefit-plans-repository';
import { GetBenefitPlanUseCase } from '../get-benefit-plan';

export function makeGetBenefitPlanUseCase() {
  const benefitPlansRepository = new PrismaBenefitPlansRepository();
  return new GetBenefitPlanUseCase(benefitPlansRepository);
}
