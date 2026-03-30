import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { GenerateDirfReportUseCase } from '../generate-dirf-report';

export function makeGenerateDirfReportUseCase(): GenerateDirfReportUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const dependantsRepository = new PrismaDependantsRepository();
  return new GenerateDirfReportUseCase(
    employeesRepository,
    payrollsRepository,
    payrollItemsRepository,
    dependantsRepository,
  );
}
