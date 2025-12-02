import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { ProcessPayrollPaymentUseCase } from '../process-payroll-payment';

export function makeProcessPayrollPaymentUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const bonusesRepository = new PrismaBonusesRepository();
  const deductionsRepository = new PrismaDeductionsRepository();

  return new ProcessPayrollPaymentUseCase(
    payrollsRepository,
    payrollItemsRepository,
    bonusesRepository,
    deductionsRepository,
  );
}
