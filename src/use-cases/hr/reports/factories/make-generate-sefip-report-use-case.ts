import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { GenerateSefipReportUseCase } from '../generate-sefip-report';

export function makeGenerateSefipReportUseCase(): GenerateSefipReportUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  return new GenerateSefipReportUseCase(
    employeesRepository,
    payrollsRepository,
    payrollItemsRepository,
  );
}
