import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { CreditTimeBankUseCase } from '../credit-time-bank';

export function makeCreditTimeBankUseCase(): CreditTimeBankUseCase {
  const timeBankRepository = new PrismaTimeBankRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new CreditTimeBankUseCase(
    timeBankRepository,
    employeesRepository,
  );

  return useCase;
}
