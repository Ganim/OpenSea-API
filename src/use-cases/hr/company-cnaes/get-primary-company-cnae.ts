import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import type { CompanyAeRepository } from '@/repositories/hr/company-cnaes-repository';

export interface GetPrimaryCompanyCnaeRequest {
  companyId: string;
}

export interface GetPrimaryCompanyCnaeResponse {
  cnae: CompanyCnae | null;
}

export class GetPrimaryCompanyCnaeUseCase {
  constructor(private companyCnaesRepository: CompanyAeRepository) {}

  async execute(
    request: GetPrimaryCompanyCnaeRequest,
  ): Promise<GetPrimaryCompanyCnaeResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const cnae =
      await this.companyCnaesRepository.findPrimaryByCompany(companyId);

    return { cnae };
  }
}
