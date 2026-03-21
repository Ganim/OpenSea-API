import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { CancelInventorySessionUseCase } from '../cancel-inventory-session';

export function makeCancelInventorySessionUseCase() {
  return new CancelInventorySessionUseCase(
    new PrismaInventorySessionsRepository(),
  );
}
