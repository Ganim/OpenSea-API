import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyAddress,
  CompanyAddressType,
} from '@/entities/hr/company-address';
import type { CompanyAddressesRepository } from '@/repositories/hr/company-addresses-repository';

export interface GetPrimaryCompanyAddressRequest {
  companyId: string;
  type: CompanyAddressType;
}

export interface GetPrimaryCompanyAddressResponse {
  address: CompanyAddress | null;
}

export class GetPrimaryCompanyAddressUseCase {
  constructor(private companyAddressesRepository: CompanyAddressesRepository) {}

  async execute(
    request: GetPrimaryCompanyAddressRequest,
  ): Promise<GetPrimaryCompanyAddressResponse> {
    const companyId = new UniqueEntityID(request.companyId);
    const address = await this.companyAddressesRepository.findPrimaryByType(
      companyId,
      request.type,
    );

    return { address };
  }
}
