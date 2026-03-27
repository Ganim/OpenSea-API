import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantIntegrationDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import { tenantIntegrationToDTO } from '@/mappers/sales/integration/tenant-integration-to-dto';
import type { TenantIntegrationsRepository } from '@/repositories/sales/tenant-integrations-repository';

interface SyncIntegrationUseCaseRequest {
  tenantId: string;
  tenantIntegrationId: string;
}

interface SyncIntegrationUseCaseResponse {
  tenantIntegration: TenantIntegrationDTO;
}

export class SyncIntegrationUseCase {
  constructor(
    private tenantIntegrationsRepository: TenantIntegrationsRepository,
  ) {}

  async execute(
    input: SyncIntegrationUseCaseRequest,
  ): Promise<SyncIntegrationUseCaseResponse> {
    const tenantIntegration = await this.tenantIntegrationsRepository.findById(
      new UniqueEntityID(input.tenantIntegrationId),
      input.tenantId,
    );

    if (!tenantIntegration) {
      throw new ResourceNotFoundError('Tenant integration not found.');
    }

    if (tenantIntegration.status !== 'CONNECTED') {
      throw new BadRequestError(
        'Cannot sync a disconnected or errored integration.',
      );
    }

    // Placeholder: actual sync logic will be implemented per integration
    const updatedIntegration = await this.tenantIntegrationsRepository.update({
      id: tenantIntegration.id,
      tenantId: input.tenantId,
      lastSyncAt: new Date(),
      errorMessage: null,
    });

    return {
      tenantIntegration: tenantIntegrationToDTO(updatedIntegration!),
    };
  }
}
