import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { GenerateRaisReportUseCase } from '../generate-rais-report';

export function makeGenerateRaisReportUseCase(): GenerateRaisReportUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const terminationsRepository = new PrismaTerminationsRepository();
  return new GenerateRaisReportUseCase(
    employeesRepository,
    payrollsRepository,
    payrollItemsRepository,
    terminationsRepository,
  );
}
