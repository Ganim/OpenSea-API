import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { GenerateEmployeesReportUseCase } from '../generate-employees-report';

export function makeGenerateEmployeesReportUseCase(): GenerateEmployeesReportUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new GenerateEmployeesReportUseCase(employeesRepository);
}
