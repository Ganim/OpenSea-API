import { PrismaPosFiscalConfigsRepository } from '@/repositories/sales/prisma/prisma-pos-fiscal-configs-repository';

import { GetTenantFiscalConfigUseCase } from '../get-tenant-fiscal-config';

export function makeGetTenantFiscalConfigUseCase(): GetTenantFiscalConfigUseCase {
  return new GetTenantFiscalConfigUseCase(
    new PrismaPosFiscalConfigsRepository(),
  );
}
