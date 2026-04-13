import { PrismaProductionEntriesRepository } from '@/repositories/production/prisma/prisma-production-entries-repository';
import { CreateProductionEntryUseCase } from '../create-production-entry';

export function makeCreateProductionEntryUseCase() {
  const productionEntriesRepository = new PrismaProductionEntriesRepository();
  const createProductionEntryUseCase = new CreateProductionEntryUseCase(
    productionEntriesRepository,
  );
  return createProductionEntryUseCase;
}
