import { PrismaIntegrationsRepository } from '@/repositories/sales/prisma/prisma-integrations-repository';
import { PrismaTenantIntegrationsRepository } from '@/repositories/sales/prisma/prisma-tenant-integrations-repository';
import { ConnectIntegrationUseCase } from '../connect-integration';

export function makeConnectIntegrationUseCase() {
  const integrationsRepository = new PrismaIntegrationsRepository();
  const tenantIntegrationsRepository = new PrismaTenantIntegrationsRepository();
  return new ConnectIntegrationUseCase(
    integrationsRepository,
    tenantIntegrationsRepository,
  );
}
