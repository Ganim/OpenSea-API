import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { GetPayrollUseCase } from '../get-payroll';

export function makeGetPayrollUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  return new GetPayrollUseCase(payrollsRepository);
}
