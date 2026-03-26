import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { DeleteMedicalExamUseCase } from '../delete-medical-exam';

export function makeDeleteMedicalExamUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new DeleteMedicalExamUseCase(medicalExamsRepository);
}
