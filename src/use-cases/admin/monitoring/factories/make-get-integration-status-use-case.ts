import { PrismaTenantIntegrationStatusRepository } from '@/repositories/core/prisma/prisma-tenant-integration-status-repository';
import { GetIntegrationStatusUseCase } from '../get-integration-status';

export function makeGetIntegrationStatusUseCase() {
  const integrationStatusRepository =
    new PrismaTenantIntegrationStatusRepository();
  return new GetIntegrationStatusUseCase(integrationStatusRepository);
}
