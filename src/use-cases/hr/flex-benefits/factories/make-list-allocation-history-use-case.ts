import { PrismaFlexBenefitAllocationsRepository } from '@/repositories/hr/prisma/prisma-flex-benefit-allocations-repository';
import { ListAllocationHistoryUseCase } from '../list-allocation-history';

export function makeListAllocationHistoryUseCase() {
  const flexBenefitAllocationsRepository =
    new PrismaFlexBenefitAllocationsRepository();
  return new ListAllocationHistoryUseCase(flexBenefitAllocationsRepository);
}
