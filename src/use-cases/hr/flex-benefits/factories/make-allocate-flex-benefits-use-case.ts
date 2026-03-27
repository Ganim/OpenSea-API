import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaFlexBenefitAllocationsRepository } from '@/repositories/hr/prisma/prisma-flex-benefit-allocations-repository';
import { AllocateFlexBenefitsUseCase } from '../allocate-flex-benefits';

export function makeAllocateFlexBenefitsUseCase() {
  const flexBenefitAllocationsRepository =
    new PrismaFlexBenefitAllocationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new AllocateFlexBenefitsUseCase(
    flexBenefitAllocationsRepository,
    employeesRepository,
  );
}
