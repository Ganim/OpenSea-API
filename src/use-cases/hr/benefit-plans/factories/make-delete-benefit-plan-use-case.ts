import { PrismaBenefitPlansRepository } from '@/repositories/hr/prisma/prisma-benefit-plans-repository';
import { DeleteBenefitPlanUseCase } from '../delete-benefit-plan';

export function makeDeleteBenefitPlanUseCase() {
  const benefitPlansRepository = new PrismaBenefitPlansRepository();
  return new DeleteBenefitPlanUseCase(benefitPlansRepository);
}
