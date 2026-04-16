import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { PrismaOneOnOneTalkingPointsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-talking-points-repository';
import { UpdateTalkingPointUseCase } from '../update-talking-point';

export function makeUpdateTalkingPointUseCase(): UpdateTalkingPointUseCase {
  return new UpdateTalkingPointUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaOneOnOneTalkingPointsRepository(),
  );
}
