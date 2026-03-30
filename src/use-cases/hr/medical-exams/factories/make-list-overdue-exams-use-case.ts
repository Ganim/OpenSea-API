import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { ListOverdueExamsUseCase } from '../list-overdue-exams';

export function makeListOverdueExamsUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new ListOverdueExamsUseCase(medicalExamsRepository);
}
