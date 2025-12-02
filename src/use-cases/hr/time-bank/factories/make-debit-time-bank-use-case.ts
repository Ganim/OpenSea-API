import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { DebitTimeBankUseCase } from '../debit-time-bank';

export function makeDebitTimeBankUseCase(): DebitTimeBankUseCase {
  const timeBankRepository = new PrismaTimeBankRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new DebitTimeBankUseCase(
    timeBankRepository,
    employeesRepository,
  );

  return useCase;
}
