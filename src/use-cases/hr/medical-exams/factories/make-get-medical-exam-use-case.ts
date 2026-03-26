import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { GetMedicalExamUseCase } from '../get-medical-exam';

export function makeGetMedicalExamUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new GetMedicalExamUseCase(medicalExamsRepository);
}
