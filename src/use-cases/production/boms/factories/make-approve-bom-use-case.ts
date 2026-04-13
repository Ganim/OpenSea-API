import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { ApproveBomUseCase } from '../approve-bom';

export function makeApproveBomUseCase() {
  const bomsRepository = new PrismaBomsRepository();
  return new ApproveBomUseCase(bomsRepository);
}
