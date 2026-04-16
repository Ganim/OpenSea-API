import { PrismaOneOnOneTalkingPointsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-talking-points-repository';
import { DeleteTalkingPointUseCase } from '../delete-talking-point';

export function makeDeleteTalkingPointUseCase(): DeleteTalkingPointUseCase {
  return new DeleteTalkingPointUseCase(
    new PrismaOneOnOneTalkingPointsRepository(),
  );
}
