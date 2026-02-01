import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { CreatePlanUseCase } from '../create-plan';

export function makeCreatePlanUseCase() {
  const plansRepository = new PrismaPlansRepository();
  return new CreatePlanUseCase(plansRepository);
}
