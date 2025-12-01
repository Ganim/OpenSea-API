import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { GetTimeBankUseCase } from '../get-time-bank';

export function makeGetTimeBankUseCase(): GetTimeBankUseCase {
  const timeBankRepository = new PrismaTimeBankRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new GetTimeBankUseCase(
    timeBankRepository,
    employeesRepository,
  );

  return useCase;
}
