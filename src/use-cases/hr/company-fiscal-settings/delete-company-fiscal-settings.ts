import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyFiscalSettingsRepository } from '@/repositories/hr/company-fiscal-settings-repository';

export interface DeleteCompanyFiscalSettingsRequest {
  companyId: string;
}

export interface DeleteCompanyFiscalSettingsResponse {
  success: boolean;
}

export class DeleteCompanyFiscalSettingsUseCase {
  constructor(
    private companyFiscalSettingsRepository: CompanyFiscalSettingsRepository,
  ) {}

  async execute(
    request: DeleteCompanyFiscalSettingsRequest,
  ): Promise<DeleteCompanyFiscalSettingsResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const fiscalSettings =
      await this.companyFiscalSettingsRepository.findByCompanyId(companyId);

    if (!fiscalSettings) {
      throw new ResourceNotFoundError(
        'Fiscal settings not found for this company',
      );
    }

    await this.companyFiscalSettingsRepository.softDelete(fiscalSettings.id);

    return { success: true };
  }
}
