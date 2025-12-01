import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { AdjustTimeBankUseCase } from '../adjust-time-bank';

export function makeAdjustTimeBankUseCase(): AdjustTimeBankUseCase {
  const timeBankRepository = new PrismaTimeBankRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new AdjustTimeBankUseCase(
    timeBankRepository,
    employeesRepository,
  );

  return useCase;
}
