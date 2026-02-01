import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { ListPlansUseCase } from '../list-plans';

export function makeListPlansUseCase() {
  const plansRepository = new PrismaPlansRepository();
  return new ListPlansUseCase(plansRepository);
}
