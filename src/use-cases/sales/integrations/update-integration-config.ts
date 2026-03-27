import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantIntegrationDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import { tenantIntegrationToDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import type { TenantIntegrationsRepository } from '@/repositories/sales/tenant-integrations-repository';

interface UpdateIntegrationConfigUseCaseRequest {
  tenantId: string;
  tenantIntegrationId: string;
  config: Record<string, unknown>;
}

interface UpdateIntegrationConfigUseCaseResponse {
  tenantIntegration: TenantIntegrationDTO;
}

export class UpdateIntegrationConfigUseCase {
  constructor(
    private tenantIntegrationsRepository: TenantIntegrationsRepository,
  ) {}

  async execute(
    input: UpdateIntegrationConfigUseCaseRequest,
  ): Promise<UpdateIntegrationConfigUseCaseResponse> {
    const tenantIntegration = await this.tenantIntegrationsRepository.findById(
      new UniqueEntityID(input.tenantIntegrationId),
      input.tenantId,
    );

    if (!tenantIntegration) {
      throw new ResourceNotFoundError('Tenant integration not found.');
    }

    if (tenantIntegration.status === 'DISCONNECTED') {
      throw new BadRequestError(
        'Cannot update config of a disconnected integration.',
      );
    }

    const updatedIntegration = await this.tenantIntegrationsRepository.update({
      id: tenantIntegration.id,
      tenantId: input.tenantId,
      config: input.config,
    });

    return {
      tenantIntegration: tenantIntegrationToDTO(updatedIntegration!),
    };
  }
}
