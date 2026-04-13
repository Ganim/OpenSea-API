import { PrismaMaterialIssuesRepository } from '@/repositories/production/prisma/prisma-material-issues-repository';
import { ListMaterialIssuesUseCase } from '../list-material-issues';

export function makeListMaterialIssuesUseCase() {
  const materialIssuesRepository = new PrismaMaterialIssuesRepository();
  const listMaterialIssuesUseCase = new ListMaterialIssuesUseCase(
    materialIssuesRepository,
  );
  return listMaterialIssuesUseCase;
}
