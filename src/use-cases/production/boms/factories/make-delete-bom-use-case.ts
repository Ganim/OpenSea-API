import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { DeleteBomUseCase } from '../delete-bom';

export function makeDeleteBomUseCase() {
  const bomsRepository = new PrismaBomsRepository();
  return new DeleteBomUseCase(bomsRepository);
}
