import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { RegisterItemExitUseCase } from '../register-item-exit';

export function makeRegisterItemExitUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();

  return new RegisterItemExitUseCase(itemsRepository, itemMovementsRepository);
}
