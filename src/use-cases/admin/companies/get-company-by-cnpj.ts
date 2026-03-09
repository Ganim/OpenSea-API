import type { Company } from '@/entities/hr/company';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';

export interface GetCompanyByCnpjRequest {
  tenantId: string;
  cnpj: string;
  includeDeleted?: boolean;
}

export interface GetCompanyByCnpjResponse {
  exists: boolean;
  companyId?: string;
  company?: Company;
}

export class GetCompanyByCnpjUseCase {
  constructor(private companiesRepository: CompaniesRepository) {}

  async execute(
    request: GetCompanyByCnpjRequest,
  ): Promise<GetCompanyByCnpjResponse> {
    const company = await this.companiesRepository.findByCnpj(
      request.cnpj,
      request.tenantId,
      request.includeDeleted,
    );

    if (!company) {
      return { exists: false };
    }

    return {
      exists: true,
      companyId: company.id.toString(),
      company,
    };
  }
}
