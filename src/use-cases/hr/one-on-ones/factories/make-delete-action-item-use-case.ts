import { PrismaOneOnOneActionItemsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-action-items-repository';
import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { DeleteActionItemUseCase } from '../delete-action-item';

export function makeDeleteActionItemUseCase(): DeleteActionItemUseCase {
  return new DeleteActionItemUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaOneOnOneActionItemsRepository(),
  );
}
