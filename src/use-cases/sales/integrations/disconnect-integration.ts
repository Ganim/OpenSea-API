import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantIntegrationDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import { tenantIntegrationToDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import type { TenantIntegrationsRepository } from '@/repositories/sales/tenant-integrations-repository';

interface DisconnectIntegrationUseCaseRequest {
  tenantId: string;
  tenantIntegrationId: string;
}

interface DisconnectIntegrationUseCaseResponse {
  tenantIntegration: TenantIntegrationDTO;
}

export class DisconnectIntegrationUseCase {
  constructor(
    private tenantIntegrationsRepository: TenantIntegrationsRepository,
  ) {}

  async execute(
    input: DisconnectIntegrationUseCaseRequest,
  ): Promise<DisconnectIntegrationUseCaseResponse> {
    const tenantIntegration = await this.tenantIntegrationsRepository.findById(
      new UniqueEntityID(input.tenantIntegrationId),
      input.tenantId,
    );

    if (!tenantIntegration) {
      throw new ResourceNotFoundError('Tenant integration not found.');
    }

    if (tenantIntegration.status === 'DISCONNECTED') {
      throw new BadRequestError('This integration is already disconnected.');
    }

    const updatedIntegration = await this.tenantIntegrationsRepository.update({
      id: tenantIntegration.id,
      tenantId: input.tenantId,
      config: {},
      status: 'DISCONNECTED',
      errorMessage: null,
    });

    return {
      tenantIntegration: tenantIntegrationToDTO(updatedIntegration!),
    };
  }
}
