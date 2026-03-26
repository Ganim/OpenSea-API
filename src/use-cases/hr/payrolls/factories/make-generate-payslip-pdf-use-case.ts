import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { GeneratePayslipPDFUseCase } from '../generate-payslip-pdf';

export function makeGeneratePayslipPDFUseCase() {
  const payrollsRepository = new PrismaPayrollsRepository();
  const payrollItemsRepository = new PrismaPayrollItemsRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new GeneratePayslipPDFUseCase(
    payrollsRepository,
    payrollItemsRepository,
    employeesRepository,
  );
}
