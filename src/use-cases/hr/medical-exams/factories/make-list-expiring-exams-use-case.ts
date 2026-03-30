import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { ListExpiringExamsUseCase } from '../list-expiring-exams';

export function makeListExpiringExamsUseCase() {
  const medicalExamsRepository = new PrismaMedicalExamsRepository();
  return new ListExpiringExamsUseCase(medicalExamsRepository);
}
