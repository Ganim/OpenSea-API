import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOneOnOneActionItemsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-action-items-repository';
import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { UpdateActionItemUseCase } from '../update-action-item';

export function makeUpdateActionItemUseCase(): UpdateActionItemUseCase {
  return new UpdateActionItemUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaOneOnOneActionItemsRepository(),
    new PrismaEmployeesRepository(),
  );
}
