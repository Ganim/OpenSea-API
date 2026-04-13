import { PrismaDefectTypesRepository } from '@/repositories/production/prisma/prisma-defect-types-repository';
import { CreateDefectTypeUseCase } from '../create-defect-type';

export function makeCreateDefectTypeUseCase() {
  const defectTypesRepository = new PrismaDefectTypesRepository();
  return new CreateDefectTypeUseCase(defectTypesRepository);
}
