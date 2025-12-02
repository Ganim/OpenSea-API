import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { CalculatePayrollUseCase } from '../calculate-payroll';

export function makeCalculatePayrollUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const overtimeRepository = new PrismaOvertimeRepository();
  const absencesRepository = new PrismaAbsencesRepository();
  const bonusesRepository = new PrismaBonusesRepository();
  const deductionsRepository = new PrismaDeductionsRepository();

  return new CalculatePayrollUseCase(
    payrollsRepository,
    payrollItemsRepository,
    employeesRepository,
    overtimeRepository,
    absencesRepository,
    bonusesRepository,
    deductionsRepository,
  );
}
