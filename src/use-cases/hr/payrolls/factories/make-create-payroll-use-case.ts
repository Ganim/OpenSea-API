import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { CreatePayrollUseCase } from '../create-payroll';

export function makeCreatePayrollUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  return new CreatePayrollUseCase(payrollsRepository);
}
