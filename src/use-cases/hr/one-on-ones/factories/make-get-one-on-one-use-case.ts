import { PrismaOneOnOneActionItemsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-action-items-repository';
import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { PrismaOneOnOneTalkingPointsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-talking-points-repository';
import { GetOneOnOneUseCase } from '../get-one-on-one';

export function makeGetOneOnOneUseCase(): GetOneOnOneUseCase {
  return new GetOneOnOneUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaOneOnOneTalkingPointsRepository(),
    new PrismaOneOnOneActionItemsRepository(),
  );
}
