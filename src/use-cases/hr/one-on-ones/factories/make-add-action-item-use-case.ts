import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOneOnOneActionItemsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-action-items-repository';
import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { AddActionItemUseCase } from '../add-action-item';

export function makeAddActionItemUseCase(): AddActionItemUseCase {
  return new AddActionItemUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaOneOnOneActionItemsRepository(),
    new PrismaEmployeesRepository(),
  );
}
