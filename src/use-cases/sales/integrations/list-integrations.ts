import type { IntegrationDTO } from '@/mappers/sales/integration/integration-to-dto';
import { integrationToDTO } from '@/mappers/sales/integration/integration-to-dto';
import type { IntegrationsRepository } from '@/repositories/sales/integrations-repository';

interface ListIntegrationsUseCaseResponse {
  integrations: IntegrationDTO[];
}

export class ListIntegrationsUseCase {
  constructor(private integrationsRepository: IntegrationsRepository) {}

  async execute(): Promise<ListIntegrationsUseCaseResponse> {
    const allIntegrations = await this.integrationsRepository.findAll();

    return {
      integrations: allIntegrations.map(integrationToDTO),
    };
  }
}
