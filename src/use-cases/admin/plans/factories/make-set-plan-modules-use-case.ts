import { PrismaPlanModulesRepository } from '@/repositories/core/prisma/prisma-plan-modules-repository';
import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { SetPlanModulesUseCase } from '../set-plan-modules';

export function makeSetPlanModulesUseCase() {
  const plansRepository = new PrismaPlansRepository();
  const planModulesRepository = new PrismaPlanModulesRepository();
  return new SetPlanModulesUseCase(plansRepository, planModulesRepository);
}
