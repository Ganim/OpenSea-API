import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { GenerateAbsencesReportUseCase } from '../generate-absences-report';

export function makeGenerateAbsencesReportUseCase(): GenerateAbsencesReportUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  return new GenerateAbsencesReportUseCase(absencesRepository);
}
