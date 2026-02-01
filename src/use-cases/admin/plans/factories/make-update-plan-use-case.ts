import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { UpdatePlanUseCase } from '../update-plan';

export function makeUpdatePlanUseCase() {
  const plansRepository = new PrismaPlansRepository();
  return new UpdatePlanUseCase(plansRepository);
}
