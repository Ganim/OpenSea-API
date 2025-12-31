import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyFiscalSettings } from '@/entities/hr/company-fiscal-settings';
import type { CompanyFiscalSettingsRepository } from '@/repositories/hr/company-fiscal-settings-repository';

export interface GetCompanyFiscalSettingsRequest {
  companyId: string;
  includeSensitive?: boolean;
}

export interface GetCompanyFiscalSettingsResponse {
  fiscalSettings: CompanyFiscalSettings;
}

export class GetCompanyFiscalSettingsUseCase {
  constructor(
    private companyFiscalSettingsRepository: CompanyFiscalSettingsRepository,
  ) {}

  async execute(
    request: GetCompanyFiscalSettingsRequest,
  ): Promise<GetCompanyFiscalSettingsResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const fiscalSettings =
      await this.companyFiscalSettingsRepository.findByCompanyId(companyId);

    if (!fiscalSettings) {
      throw new ResourceNotFoundError('Company fiscal settings');
    }

    return { fiscalSettings };
  }
}
