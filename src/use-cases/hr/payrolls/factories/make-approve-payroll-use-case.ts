import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { ApprovePayrollUseCase } from '../approve-payroll';

export function makeApprovePayrollUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  return new ApprovePayrollUseCase(payrollsRepository);
}
