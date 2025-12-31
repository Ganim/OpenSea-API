import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyAddress,
  CompanyAddressType,
} from '@/entities/hr/company-address';
import type { CompanyAddressesRepository } from '@/repositories/hr/company-addresses-repository';

export interface CreateCompanyAddressRequest {
  companyId: string;
  type?: CompanyAddressType;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  zip: string;
  ibgeCityCode?: string;
  countryCode?: string;
  isPrimary?: boolean;
}

export interface CreateCompanyAddressResponse {
  address: CompanyAddress;
}

export class CreateCompanyAddressUseCase {
  constructor(private companyAddressesRepository: CompanyAddressesRepository) {}

  async execute(
    request: CreateCompanyAddressRequest,
  ): Promise<CreateCompanyAddressResponse> {
    const companyId = new UniqueEntityID(request.companyId);
    const type: CompanyAddressType = request.type ?? 'OTHER';

    // Unique constraint by company + type (active only)
    const existingSameType =
      await this.companyAddressesRepository.findByCompanyAndType(
        companyId,
        type,
      );
    if (existingSameType) {
      throw new BadRequestError('Address type already exists for this company');
    }

    const pendingIssues = this.computePendingIssues({
      typeProvided: request.type !== undefined,
      street: request.street,
      number: request.number,
      complement: request.complement,
      district: request.district,
      city: request.city,
      state: request.state,
      ibgeCityCode: request.ibgeCityCode,
    });

    const address = await this.companyAddressesRepository.create({
      companyId,
      type,
      street: request.street,
      number: request.number,
      complement: request.complement,
      district: request.district,
      city: request.city,
      state: request.state,
      zip: request.zip,
      ibgeCityCode: request.ibgeCityCode,
      countryCode: request.countryCode,
      isPrimary: request.isPrimary ?? false,
      pendingIssues,
      metadata: {},
    });

    if (address.isPrimary) {
      await this.companyAddressesRepository.unsetPrimaryForType(
        companyId,
        type,
        address.id,
      );
    }

    return { address };
  }

  private computePendingIssues(input: {
    typeProvided: boolean;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    ibgeCityCode?: string;
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
