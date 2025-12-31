import type { CompaniesRepository } from '@/repositories/hr/companies-repository';
import { Company } from '@/entities/hr/company';

export interface ListCompaniesRequest {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface ListCompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  perPage: number;
}

export class ListCompaniesUseCase {
  constructor(private companiesRepository: CompaniesRepository) {}

  async execute(request: ListCompaniesRequest): Promise<ListCompaniesResponse> {
    const { page = 1, perPage = 20, search, includeDeleted = false } = request;

    const { companies, total } = await this.companiesRepository.findMany({
      page,
      perPage,
      search,
      includeDeleted,
    });

    return {
      companies,
      total,
      page,
      perPage,
    };
  }
}
