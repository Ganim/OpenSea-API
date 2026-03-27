import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { IntegrationDTO } from '@/mappers/sales/integration/integration-to-dto';
import { integrationToDTO } from '@/mappers/sales/integration/integration-to-dto';
import type { IntegrationsRepository } from '@/repositories/sales/integrations-repository';

interface GetIntegrationByIdUseCaseRequest {
  integrationId: string;
}

interface GetIntegrationByIdUseCaseResponse {
  integration: IntegrationDTO;
}

export class GetIntegrationByIdUseCase {
  constructor(private integrationsRepository: IntegrationsRepository) {}

  async execute(
    input: GetIntegrationByIdUseCaseRequest,
  ): Promise<GetIntegrationByIdUseCaseResponse> {
    const integration = await this.integrationsRepository.findById(
      new UniqueEntityID(input.integrationId),
    );

    if (!integration) {
      throw new ResourceNotFoundError('Integration not found.');
    }

    return {
      integration: integrationToDTO(integration),
    };
  }
}
