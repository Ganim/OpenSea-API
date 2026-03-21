import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { ResumeInventorySessionUseCase } from '../resume-inventory-session';

export function makeResumeInventorySessionUseCase() {
  return new ResumeInventorySessionUseCase(
    new PrismaInventorySessionsRepository(),
  );
}
