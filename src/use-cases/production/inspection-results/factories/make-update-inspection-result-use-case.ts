import { PrismaInspectionResultsRepository } from '@/repositories/production/prisma/prisma-inspection-results-repository';
import { UpdateInspectionResultUseCase } from '../update-inspection-result';

export function makeUpdateInspectionResultUseCase() {
  const inspectionResultsRepository = new PrismaInspectionResultsRepository();
  const updateInspectionResultUseCase = new UpdateInspectionResultUseCase(
    inspectionResultsRepository,
  );
  return updateInspectionResultUseCase;
}
