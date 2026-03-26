import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { GenerateTRCTPDFUseCase } from '../generate-trct-pdf';

export function makeGenerateTRCTPDFUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new GenerateTRCTPDFUseCase(
    terminationsRepository,
    employeesRepository,
  );
}
