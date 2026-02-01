import { PrismaPlanModulesRepository } from '@/repositories/core/prisma/prisma-plan-modules-repository';
import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { GetPlanByIdUseCase } from '../get-plan-by-id';

export function makeGetPlanByIdUseCase() {
  const plansRepository = new PrismaPlansRepository();
  const planModulesRepository = new PrismaPlanModulesRepository();
  return new GetPlanByIdUseCase(plansRepository, planModulesRepository);
}
