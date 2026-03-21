import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { PauseInventorySessionUseCase } from '../pause-inventory-session';

export function makePauseInventorySessionUseCase() {
  return new PauseInventorySessionUseCase(
    new PrismaInventorySessionsRepository(),
  );
}
