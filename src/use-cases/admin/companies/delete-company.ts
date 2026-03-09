import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';

export interface DeleteCompanyRequest {
  tenantId: string;
  id: string;
}

export interface DeleteCompanyResponse {
  success: boolean;
}

export class DeleteCompanyUseCase {
  constructor(private companiesRepository: CompaniesRepository) {}

  async execute(request: DeleteCompanyRequest): Promise<DeleteCompanyResponse> {
    await this.companiesRepository.delete(new UniqueEntityID(request.id));

    return { success: true };
  }
}
