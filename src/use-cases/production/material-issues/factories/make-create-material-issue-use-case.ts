import { PrismaMaterialIssuesRepository } from '@/repositories/production/prisma/prisma-material-issues-repository';
import { CreateMaterialIssueUseCase } from '../create-material-issue';

export function makeCreateMaterialIssueUseCase() {
  const materialIssuesRepository = new PrismaMaterialIssuesRepository();
  const createMaterialIssueUseCase = new CreateMaterialIssueUseCase(
    materialIssuesRepository,
  );
  return createMaterialIssueUseCase;
}
