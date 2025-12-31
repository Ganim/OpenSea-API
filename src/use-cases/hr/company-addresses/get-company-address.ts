import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAddress } from '@/entities/hr/company-address';
import type { CompanyAddressesRepository } from '@/repositories/hr/company-addresses-repository';

export interface GetCompanyAddressRequest {
  companyId: string;
  addressId: string;
  includeDeleted?: boolean;
}

export interface GetCompanyAddressResponse {
  address: CompanyAddress | null;
}

export class GetCompanyAddressUseCase {
  constructor(private companyAddressesRepository: CompanyAddressesRepository) {}

  async execute(
    request: GetCompanyAddressRequest,
  ): Promise<GetCompanyAddressResponse> {
    const addressId = new UniqueEntityID(request.addressId);
    const companyId = new UniqueEntityID(request.companyId);

    const address = await this.companyAddressesRepository.findById(addressId, {
      companyId,
      includeDeleted: request.includeDeleted,
    });

    return { address };
  }
}
