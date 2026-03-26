import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { UpdateMedicalExamUseCase } from '../update-medical-exam';

export function makeUpdateMedicalExamUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new UpdateMedicalExamUseCase(medicalExamsRepository);
}
