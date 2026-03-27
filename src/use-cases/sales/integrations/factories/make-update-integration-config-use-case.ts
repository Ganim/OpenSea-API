import { PrismaTenantIntegrationsRepository } from '@/repositories/sales/prisma/prisma-tenant-integrations-repository';
import { UpdateIntegrationConfigUseCase } from '../update-integration-config';

export function makeUpdateIntegrationConfigUseCase() {
  const tenantIntegrationsRepository = new PrismaTenantIntegrationsRepository();
  return new UpdateIntegrationConfigUseCase(tenantIntegrationsRepository);
}
