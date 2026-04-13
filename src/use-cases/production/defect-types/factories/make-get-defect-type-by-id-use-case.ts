import { PrismaDefectTypesRepository } from '@/repositories/production/prisma/prisma-defect-types-repository';
import { GetDefectTypeByIdUseCase } from '../get-defect-type-by-id';

export function makeGetDefectTypeByIdUseCase() {
  const defectTypesRepository = new PrismaDefectTypesRepository();
  return new GetDefectTypeByIdUseCase(defectTypesRepository);
}
