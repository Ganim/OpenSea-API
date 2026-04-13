import { PrismaInspectionResultsRepository } from '@/repositories/production/prisma/prisma-inspection-results-repository';
import { ListInspectionResultsUseCase } from '../list-inspection-results';

export function makeListInspectionResultsUseCase() {
  const inspectionResultsRepository = new PrismaInspectionResultsRepository();
  const listInspectionResultsUseCase = new ListInspectionResultsUseCase(
    inspectionResultsRepository,
  );
  return listInspectionResultsUseCase;
}
