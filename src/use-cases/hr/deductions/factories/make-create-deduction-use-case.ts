import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateDeductionUseCase } from '../create-deduction';

export function makeCreateDeductionUseCase() {
  const deductionsRepository = new PrismaDeductionsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CreateDeductionUseCase(deductionsRepository, employeesRepository);
}
