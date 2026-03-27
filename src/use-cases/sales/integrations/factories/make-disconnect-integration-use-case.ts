import { PrismaTenantIntegrationsRepository } from '@/repositories/sales/prisma/prisma-tenant-integrations-repository';
import { DisconnectIntegrationUseCase } from '../disconnect-integration';

export function makeDisconnectIntegrationUseCase() {
  const tenantIntegrationsRepository = new PrismaTenantIntegrationsRepository();
  return new DisconnectIntegrationUseCase(tenantIntegrationsRepository);
}
