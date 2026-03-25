import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { ConfigureFiscalUseCase } from '../configure-fiscal';

/**
 * Factory for ConfigureFiscalUseCase.
 *
 * TODO: Replace InMemoryFiscalConfigsRepository with PrismaFiscalConfigsRepository
 * once Prisma schema models for fiscal are created.
 */
export function makeConfigureFiscalUseCase() {
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
  return new ConfigureFiscalUseCase(fiscalConfigsRepository);
}
