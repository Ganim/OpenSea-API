import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { ListMedicalExamsUseCase } from '../list-medical-exams';

export function makeListMedicalExamsUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new ListMedicalExamsUseCase(medicalExamsRepository);
}
