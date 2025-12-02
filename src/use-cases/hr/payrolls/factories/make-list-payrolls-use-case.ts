import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { ListPayrollsUseCase } from '../list-payrolls';

export function makeListPayrollsUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  return new ListPayrollsUseCase(payrollsRepository);
}
