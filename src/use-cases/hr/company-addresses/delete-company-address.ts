import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAddressesRepository } from '@/repositories/hr/company-addresses-repository';

export interface DeleteCompanyAddressRequest {
  companyId: string;
  addressId: string;
}

export class DeleteCompanyAddressUseCase {
  constructor(private companyAddressesRepository: CompanyAddressesRepository) {}

  async execute(request: DeleteCompanyAddressRequest): Promise<void> {
    const companyId = new UniqueEntityID(request.companyId);
    const addressId = new UniqueEntityID(request.addressId);

    const address = await this.companyAddressesRepository.findById(addressId, {
      companyId,
    });

    if (!address) return;

    await this.companyAddressesRepository.delete(addressId);
  }
}
