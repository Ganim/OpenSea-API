import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { UpdateBomUseCase } from '../update-bom';

export function makeUpdateBomUseCase() {
  const bomsRepository = new PrismaBomsRepository();
  return new UpdateBomUseCase(bomsRepository);
}
