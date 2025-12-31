import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyAddress,
  CompanyAddressType,
} from '@/entities/hr/company-address';
import type { CompanyAddressesRepository } from '@/repositories/hr/company-addresses-repository';

export interface UpdateCompanyAddressRequest {
  companyId: string;
  addressId: string;
  type?: CompanyAddressType;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  ibgeCityCode?: string | null;
  countryCode?: string | null;
  isPrimary?: boolean;
}

export interface UpdateCompanyAddressResponse {
  address: CompanyAddress | null;
}

export class UpdateCompanyAddressUseCase {
  constructor(private companyAddressesRepository: CompanyAddressesRepository) {}

  async execute(
    request: UpdateCompanyAddressRequest,
  ): Promise<UpdateCompanyAddressResponse> {
    const companyId = new UniqueEntityID(request.companyId);
    const addressId = new UniqueEntityID(request.addressId);

    const address = await this.companyAddressesRepository.findById(addressId, {
      companyId,
    });

    if (!address) {
      return { address: null };
    }

    const nextType: CompanyAddressType = request.type ?? address.type;

    if (request.type) {
      const duplicate =
        await this.companyAddressesRepository.findByCompanyAndType(
          companyId,
          request.type,
        );

      if (duplicate && duplicate.id.toString() !== addressId.toString()) {
        throw new BadRequestError(
          'Address type already exists for this company',
        );
      }
    }

    const pendingIssues = this.computePendingIssues({
      typeProvided: request.type !== undefined || !!address.type,
      street: request.street ?? address.street,
      number: request.number ?? address.number,
      complement: request.complement ?? address.complement,
      district: request.district ?? address.district,
      city: request.city ?? address.city,
      state: request.state ?? address.state,
      ibgeCityCode: request.ibgeCityCode ?? address.ibgeCityCode,
    });

    address.updateDetails({
      type: request.type,
      street: request.street,
      number: request.number,
      complement: request.complement,
      district: request.district,
      city: request.city,
      state: request.state,
      zip: request.zip,
      ibgeCityCode: request.ibgeCityCode,
      countryCode: request.countryCode,
      isPrimary: request.isPrimary,
      pendingIssues,
    });

    await this.companyAddressesRepository.save(address);

    if (
      request.isPrimary === true ||
      (request.isPrimary === undefined && address.isPrimary)
    ) {
      await this.companyAddressesRepository.unsetPrimaryForType(
        companyId,
        nextType,
        address.id,
      );
    }

    return { address };
  }

  private computePendingIssues(input: {
    typeProvided: boolean;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    ibgeCityCode?: string | null;
  }): string[] {
    const issues: string[] = [];

    if (!input.typeProvided) issues.push('type');
    if (!input.street) issues.push('street');
    if (!input.number) issues.push('number');
    if (!input.complement) issues.push('complement');
    if (!input.district) issues.push('district');
    if (!input.city) issues.push('city');
    if (!input.state) issues.push('state');
    if (!input.ibgeCityCode) issues.push('ibgeCityCode');

    return issues;
  }
}
