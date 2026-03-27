import { PrismaTenantIntegrationsRepository } from '@/repositories/sales/prisma/prisma-tenant-integrations-repository';
import { GetTenantIntegrationsUseCase } from '../get-tenant-integrations';

export function makeGetTenantIntegrationsUseCase() {
  const tenantIntegrationsRepository = new PrismaTenantIntegrationsRepository();
  return new GetTenantIntegrationsUseCase(tenantIntegrationsRepository);
}
