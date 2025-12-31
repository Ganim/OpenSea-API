import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyAddress,
  CompanyAddressType,
} from '@/entities/hr/company-address';
import type { CompanyAddressesRepository } from '@/repositories/hr/company-addresses-repository';

export interface ListCompanyAddressesRequest {
  companyId: string;
  type?: CompanyAddressType;
  isPrimary?: boolean;
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
}

export interface ListCompanyAddressesResponse {
  addresses: CompanyAddress[];
  total: number;
  page: number;
  perPage: number;
}

export class ListCompanyAddressesUseCase {
  constructor(private companyAddressesRepository: CompanyAddressesRepository) {}

  async execute(
    request: ListCompanyAddressesRequest,
  ): Promise<ListCompanyAddressesResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const { addresses, total } = await this.companyAddressesRepository.findMany(
      {
        companyId,
        type: request.type,
        isPrimary: request.isPrimary,
        includeDeleted: request.includeDeleted,
        page: request.page,
        perPage: request.perPage,
      },
    );

    return {
      addresses,
      total,
      page: request.page ?? 1,
      perPage: request.perPage ?? 20,
    };
  }
}
