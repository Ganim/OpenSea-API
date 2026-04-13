import { PrismaDefectRecordsRepository } from '@/repositories/production/prisma/prisma-defect-records-repository';
import { ListDefectRecordsUseCase } from '../list-defect-records';

export function makeListDefectRecordsUseCase() {
  const defectRecordsRepository = new PrismaDefectRecordsRepository();
  const listDefectRecordsUseCase = new ListDefectRecordsUseCase(
    defectRecordsRepository,
  );
  return listDefectRecordsUseCase;
}
