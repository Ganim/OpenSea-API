import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { DeletePlanUseCase } from '../delete-plan';

export function makeDeletePlanUseCase() {
  const plansRepository = new PrismaPlansRepository();
  return new DeletePlanUseCase(plansRepository);
}
