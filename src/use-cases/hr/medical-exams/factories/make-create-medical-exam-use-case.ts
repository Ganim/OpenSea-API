import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { CreateMedicalExamUseCase } from '../create-medical-exam';

export function makeCreateMedicalExamUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CreateMedicalExamUseCase(
    medicalExamsRepository,
    employeesRepository,
  );
}
