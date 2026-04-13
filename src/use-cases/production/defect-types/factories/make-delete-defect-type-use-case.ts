import { PrismaDefectTypesRepository } from '@/repositories/production/prisma/prisma-defect-types-repository';
import { DeleteDefectTypeUseCase } from '../delete-defect-type';

export function makeDeleteDefectTypeUseCase() {
  const defectTypesRepository = new PrismaDefectTypesRepository();
  return new DeleteDefectTypeUseCase(defectTypesRepository);
}
