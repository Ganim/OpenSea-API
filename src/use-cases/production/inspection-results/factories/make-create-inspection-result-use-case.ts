import { PrismaInspectionResultsRepository } from '@/repositories/production/prisma/prisma-inspection-results-repository';
import { CreateInspectionResultUseCase } from '../create-inspection-result';

export function makeCreateInspectionResultUseCase() {
  const inspectionResultsRepository = new PrismaInspectionResultsRepository();
  const createInspectionResultUseCase = new CreateInspectionResultUseCase(
    inspectionResultsRepository,
  );
  return createInspectionResultUseCase;
}
