import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import type { CompanyAeRepository } from '@/repositories/hr/company-cnaes-repository';

export interface ListCompanyCnaesRequest {
  companyId: string;
  code?: string;
  isPrimary?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
}

export interface ListCompanyCnaesResponse {
  cnaes: CompanyCnae[];
  total: number;
  page: number;
  perPage: number;
}

export class ListCompanyCnaesUseCase {
  constructor(private companyCnaesRepository: CompanyAeRepository) {}

  async execute(
    request: ListCompanyCnaesRequest,
  ): Promise<ListCompanyCnaesResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const { cnaes, total } = await this.companyCnaesRepository.findMany({
      companyId,
      code: request.code,
      isPrimary: request.isPrimary,
      status: request.status,
      includeDeleted: request.includeDeleted,
      page: request.page,
      perPage: request.perPage,
    });

    return {
      cnaes,
      total,
      page: request.page ?? 1,
      perPage: request.perPage ?? 20,
    };
  }
}
