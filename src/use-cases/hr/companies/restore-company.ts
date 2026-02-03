import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';

export interface RestoreCompanyRequest {
  tenantId: string;
  id: string;
}

export interface RestoreCompanyResponse {
  success: boolean;
}

export class RestoreCompanyUseCase {
  constructor(private companiesRepository: CompaniesRepository) {}

  async execute(
    request: RestoreCompanyRequest,
  ): Promise<RestoreCompanyResponse> {
    await this.companiesRepository.restore(new UniqueEntityID(request.id));

    return { success: true };
  }
}
