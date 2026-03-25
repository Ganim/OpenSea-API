import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { GetFiscalConfigUseCase } from '../get-fiscal-config';

/**
 * Factory for GetFiscalConfigUseCase.
 *
 * TODO: Replace InMemoryFiscalConfigsRepository with PrismaFiscalConfigsRepository
 * once Prisma schema models for fiscal are created.
 */
export function makeGetFiscalConfigUseCase() {
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
  return new GetFiscalConfigUseCase(fiscalConfigsRepository);
}
