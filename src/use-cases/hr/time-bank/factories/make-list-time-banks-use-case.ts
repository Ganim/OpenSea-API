import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { ListTimeBanksUseCase } from '../list-time-banks';

export function makeListTimeBanksUseCase(): ListTimeBanksUseCase {
  const timeBankRepository = new PrismaTimeBankRepository();
  const useCase = new ListTimeBanksUseCase(timeBankRepository);

  return useCase;
}
