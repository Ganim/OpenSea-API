import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { UpdateOneOnOneUseCase } from '../update-one-on-one';

export function makeUpdateOneOnOneUseCase(): UpdateOneOnOneUseCase {
  return new UpdateOneOnOneUseCase(new PrismaOneOnOneMeetingsRepository());
}
