import { PrismaDefectRecordsRepository } from '@/repositories/production/prisma/prisma-defect-records-repository';
import { CreateDefectRecordUseCase } from '../create-defect-record';

export function makeCreateDefectRecordUseCase() {
  const defectRecordsRepository = new PrismaDefectRecordsRepository();
  const createDefectRecordUseCase = new CreateDefectRecordUseCase(
    defectRecordsRepository,
  );
  return createDefectRecordUseCase;
}
