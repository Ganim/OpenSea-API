import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';

interface GetFiscalConfigUseCaseRequest {
  tenantId: string;
}

interface GetFiscalConfigUseCaseResponse {
  fiscalConfig: FiscalConfig;
}

export class GetFiscalConfigUseCase {
  constructor(private fiscalConfigsRepository: FiscalConfigsRepository) {}

  async execute(
    request: GetFiscalConfigUseCaseRequest,
  ): Promise<GetFiscalConfigUseCaseResponse> {
    const fiscalConfig = await this.fiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    if (!fiscalConfig) {
      throw new ResourceNotFoundError(
        'Fiscal configuration not found for this tenant. Please configure fiscal settings first.',
      );
    }

    return { fiscalConfig };
  }
}
