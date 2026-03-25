import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { GetFiscalConfigUseCase } from '../get-fiscal-config';

export function makeGetFiscalConfigUseCase() {
  const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();

  return new GetFiscalConfigUseCase(fiscalConfigsRepository);
}
