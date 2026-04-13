import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { CreateBomUseCase } from '../create-bom';

export function makeCreateBomUseCase() {
  const bomsRepository = new PrismaBomsRepository();
  return new CreateBomUseCase(bomsRepository);
}
