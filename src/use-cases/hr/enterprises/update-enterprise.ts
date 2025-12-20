import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Enterprise } from '@/entities/hr/enterprise';
import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';

export interface UpdateEnterpriseRequest {
  id: string;
  legalName?: string;
  taxRegime?: string | null;
  phone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string;
  logoUrl?: string | null;
}

export interface UpdateEnterpriseResponse {
  enterprise: Enterprise | null;
}

export class UpdateEnterpriseUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: UpdateEnterpriseRequest,
  ): Promise<UpdateEnterpriseResponse> {
    const id = new UniqueEntityID(request.id);

    const enterprise = await this.enterprisesRepository.update({
      id,
      legalName: request.legalName,
      taxRegime: request.taxRegime,
      phone: request.phone,
      address: request.address,
      addressNumber: request.addressNumber,
      complement: request.complement,
      neighborhood: request.neighborhood,
      city: request.city,
      state: request.state,
      zipCode: request.zipCode,
      country: request.country,
      logoUrl: request.logoUrl,
    });

    return { enterprise };
  }
}
