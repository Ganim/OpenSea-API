import { PrismaOneOnOneMeetingsRepository } from '@/repositories/hr/prisma/prisma-one-on-one-meetings-repository';
import { ListOneOnOnesUseCase } from '../list-one-on-ones';

export function makeListOneOnOnesUseCase(): ListOneOnOnesUseCase {
  return new ListOneOnOnesUseCase(new PrismaOneOnOneMeetingsRepository());
}
