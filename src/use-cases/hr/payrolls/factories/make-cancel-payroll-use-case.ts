import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { CancelPayrollUseCase } from '../cancel-payroll';

export function makeCancelPayrollUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  return new CancelPayrollUseCase(payrollsRepository, payrollItemsRepository);
}
