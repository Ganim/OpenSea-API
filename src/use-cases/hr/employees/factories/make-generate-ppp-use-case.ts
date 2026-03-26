import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { GeneratePPPUseCase } from '../generate-ppp-pdf';

export function makeGeneratePPPUseCase(): GeneratePPPUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new GeneratePPPUseCase(employeesRepository, medicalExamsRepository);
}
