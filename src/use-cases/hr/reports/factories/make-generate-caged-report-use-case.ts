import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { GenerateCagedReportUseCase } from '../generate-caged-report';

export function makeGenerateCagedReportUseCase(): GenerateCagedReportUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const terminationsRepository = new PrismaTerminationsRepository();
  return new GenerateCagedReportUseCase(
    employeesRepository,
    terminationsRepository,
  );
}
