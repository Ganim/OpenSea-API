import { PrismaDefectTypesRepository } from '@/repositories/production/prisma/prisma-defect-types-repository';
import { ListDefectTypesUseCase } from '../list-defect-types';

export function makeListDefectTypesUseCase() {
  const defectTypesRepository = new PrismaDefectTypesRepository();
  return new ListDefectTypesUseCase(defectTypesRepository);
}
