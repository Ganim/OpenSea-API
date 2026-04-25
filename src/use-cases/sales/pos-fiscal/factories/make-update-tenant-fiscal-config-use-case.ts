import { PrismaPosFiscalConfigsRepository } from '@/repositories/sales/prisma/prisma-pos-fiscal-configs-repository';

import { UpdateTenantFiscalConfigUseCase } from '../update-tenant-fiscal-config';

export function makeUpdateTenantFiscalConfigUseCase(): UpdateTenantFiscalConfigUseCase {
  return new UpdateTenantFiscalConfigUseCase(
    new PrismaPosFiscalConfigsRepository(),
  );
}
