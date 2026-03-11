import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { GeneratePayrollReportUseCase } from '../generate-payroll-report';

export function makeGeneratePayrollReportUseCase(): GeneratePayrollReportUseCase {
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new GeneratePayrollReportUseCase(
    payrollsRepository,
    payrollItemsRepository,
    employeesRepository,
  );
}
