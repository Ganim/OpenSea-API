import { PrismaProductionEntriesRepository } from '@/repositories/production/prisma/prisma-production-entries-repository';
import { ListProductionEntriesUseCase } from '../list-production-entries';

export function makeListProductionEntriesUseCase() {
  const productionEntriesRepository = new PrismaProductionEntriesRepository();
  const listProductionEntriesUseCase = new ListProductionEntriesUseCase(
    productionEntriesRepository,
  );
  return listProductionEntriesUseCase;
}
