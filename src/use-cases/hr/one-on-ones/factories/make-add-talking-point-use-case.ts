import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { PrismaOneOnOneTalkingPointsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-talking-points-repository';
import { AddTalkingPointUseCase } from '../add-talking-point';

export function makeAddTalkingPointUseCase(): AddTalkingPointUseCase {
  return new AddTalkingPointUseCase(
    new PrismaOneOnOneMeetingsRepository(),
    new PrismaOneOnOneTalkingPointsRepository(),
  );
}
