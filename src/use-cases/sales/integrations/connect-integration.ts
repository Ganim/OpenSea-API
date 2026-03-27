import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantIntegrationDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import { tenantIntegrationToDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import type { IntegrationsRepository } from '@/repositories/sales/integrations-repository';
import type { TenantIntegrationsRepository } from '@/repositories/sales/tenant-integrations-repository';

interface ConnectIntegrationUseCaseRequest {
  tenantId: string;
  integrationId: string;
  config: Record<string, unknown>;
}

interface ConnectIntegrationUseCaseResponse {
  tenantIntegration: TenantIntegrationDTO;
}

export class ConnectIntegrationUseCase {
  constructor(
    private integrationsRepository: IntegrationsRepository,
    private tenantIntegrationsRepository: TenantIntegrationsRepository,
  ) {}

  async execute(
    input: ConnectIntegrationUseCaseRequest,
  ): Promise<ConnectIntegrationUseCaseResponse> {
    const integration = await this.integrationsRepository.findById(
      new UniqueEntityID(input.integrationId),
    );

    if (!integration) {
      throw new ResourceNotFoundError('Integration not found.');
    }

    if (!integration.isAvailable) {
      throw new BadRequestError('This integration is not available.');
    }

    const existingConnection =
      await this.tenantIntegrationsRepository.findByTenantAndIntegration(
        input.tenantId,
        input.integrationId,
      );

    if (existingConnection && existingConnection.status === 'CONNECTED') {
      throw new BadRequestError('This integration is already connected.');
    }

    if (existingConnection) {
      const updatedConnection = await this.tenantIntegrationsRepository.update({
        id: existingConnection.id,
        tenantId: input.tenantId,
        config: input.config,
        status: 'CONNECTED',
        errorMessage: null,
      });

      return {
        tenantIntegration: tenantIntegrationToDTO(updatedConnection!),
      };
    }

    const tenantIntegration = await this.tenantIntegrationsRepository.create({
      tenantId: input.tenantId,
      integrationId: input.integrationId,
      config: input.config,
      status: 'CONNECTED',
    });

    return {
      tenantIntegration: tenantIntegrationToDTO(tenantIntegration),
    };
  }
}
