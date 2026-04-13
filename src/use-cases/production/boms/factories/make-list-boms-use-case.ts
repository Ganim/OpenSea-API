import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { ListBomsUseCase } from '../list-boms';

export function makeListBomsUseCase() {
  const bomsRepository = new PrismaBomsRepository();
  return new ListBomsUseCase(bomsRepository);
}
