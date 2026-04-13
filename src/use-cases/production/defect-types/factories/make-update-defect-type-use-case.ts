import { PrismaDefectTypesRepository } from '@/repositories/production/prisma/prisma-defect-types-repository';
import { UpdateDefectTypeUseCase } from '../update-defect-type';

export function makeUpdateDefectTypeUseCase() {
  const defectTypesRepository = new PrismaDefectTypesRepository();
  return new UpdateDefectTypeUseCase(defectTypesRepository);
}
