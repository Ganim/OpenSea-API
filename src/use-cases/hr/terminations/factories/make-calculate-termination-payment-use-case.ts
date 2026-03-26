import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { CalculateTerminationPaymentUseCase } from '../calculate-termination-payment';

export function makeCalculateTerminationPaymentUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CalculateTerminationPaymentUseCase(
    terminationsRepository,
    employeesRepository,
  );
}
