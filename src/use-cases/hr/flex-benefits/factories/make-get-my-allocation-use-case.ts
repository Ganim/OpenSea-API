import { PrismaFlexBenefitAllocationsRepository } from '@/repositories/hr/prisma/prisma-flex-benefit-allocations-repository';
import { GetMyAllocationUseCase } from '../get-my-allocation';

export function makeGetMyAllocationUseCase() {
  const flexBenefitAllocationsRepository =
    new PrismaFlexBenefitAllocationsRepository();
  return new GetMyAllocationUseCase(flexBenefitAllocationsRepository);
}
