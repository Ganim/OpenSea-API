import { PrismaBenefitPlansRepository } from '@/repositories/hr/prisma/prisma-benefit-plans-repository';
import { UpdateBenefitPlanUseCase } from '../update-benefit-plan';

export function makeUpdateBenefitPlanUseCase() {
  const benefitPlansRepository = new PrismaBenefitPlansRepository();
  return new UpdateBenefitPlanUseCase(benefitPlansRepository);
}
