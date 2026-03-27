import { PrismaBenefitPlansRepository } from '@/repositories/hr/prisma/prisma-benefit-plans-repository';
import { CreateBenefitPlanUseCase } from '../create-benefit-plan';

export function makeCreateBenefitPlanUseCase() {
  const benefitPlansRepository = new PrismaBenefitPlansRepository();
  return new CreateBenefitPlanUseCase(benefitPlansRepository);
}
