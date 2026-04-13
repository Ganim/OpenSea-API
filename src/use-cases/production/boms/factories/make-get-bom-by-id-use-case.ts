import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { GetBomByIdUseCase } from '../get-bom-by-id';

export function makeGetBomByIdUseCase() {
  const bomsRepository = new PrismaBomsRepository();
  return new GetBomByIdUseCase(bomsRepository);
}
