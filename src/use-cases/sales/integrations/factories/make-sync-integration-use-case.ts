import { PrismaTenantIntegrationsRepository } from '@/repositories/sales/prisma/prisma-tenant-integrations-repository';
import { SyncIntegrationUseCase } from '../sync-integration';

export function makeSyncIntegrationUseCase() {
  const tenantIntegrationsRepository = new PrismaTenantIntegrationsRepository();
  return new SyncIntegrationUseCase(tenantIntegrationsRepository);
}
