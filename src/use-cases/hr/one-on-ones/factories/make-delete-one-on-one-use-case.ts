import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { DeleteOneOnOneUseCase } from '../delete-one-on-one';

export function makeDeleteOneOnOneUseCase(): DeleteOneOnOneUseCase {
  return new DeleteOneOnOneUseCase(new PrismaOneOnOneMeetingsRepository());
}
