import type { TenantIntegrationDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import { tenantIntegrationToDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import type { TenantIntegrationsRepository } from '@/repositories/sales/tenant-integrations-repository';

interface GetTenantIntegrationsUseCaseRequest {
  tenantId: string;
}

interface GetTenantIntegrationsUseCaseResponse {
  tenantIntegrations: TenantIntegrationDTO[];
}

export class GetTenantIntegrationsUseCase {
  constructor(
    private tenantIntegrationsRepository: TenantIntegrationsRepository,
  ) {}

  async execute(
    input: GetTenantIntegrationsUseCaseRequest,
  ): Promise<GetTenantIntegrationsUseCaseResponse> {
    const tenantIntegrations =
      await this.tenantIntegrationsRepository.findManyByTenant(input.tenantId);

    return {
      tenantIntegrations: tenantIntegrations.map(tenantIntegrationToDTO),
    };
  }
}
