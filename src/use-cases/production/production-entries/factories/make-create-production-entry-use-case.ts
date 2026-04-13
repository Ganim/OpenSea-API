import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { PrismaProductionEntriesRepository } from '@/repositories/production/prisma/prisma-production-entries-repository';
import { CreateProductionEntryUseCase } from '../create-production-entry';

export function makeCreateProductionEntryUseCase() {
  const productionEntriesRepository = new PrismaProductionEntriesRepository();
  const jobCardsRepository = new PrismaJobCardsRepository();
  const createProductionEntryUseCase = new CreateProductionEntryUseCase(
    productionEntriesRepository,
    jobCardsRepository,
  );
  return createProductionEntryUseCase;
}
