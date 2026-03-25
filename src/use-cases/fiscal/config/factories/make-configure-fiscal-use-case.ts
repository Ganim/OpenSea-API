import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { ConfigureFiscalUseCase } from '../configure-fiscal';

export function makeConfigureFiscalUseCase() {
  const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();

  return new ConfigureFiscalUseCase(fiscalConfigsRepository);
}
