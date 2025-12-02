import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { TransferEmployeeUseCase } from '../transfer-employee';

export function makeTransferEmployeeUseCase(): TransferEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new TransferEmployeeUseCase(employeesRepository);

  return useCase;
}
