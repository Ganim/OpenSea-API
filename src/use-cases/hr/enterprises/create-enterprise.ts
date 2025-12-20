import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Enterprise } from '@/entities/hr/enterprise';
import type { EnterprisesRepository } from '@/repositories/hr/enterprises-repository';

export interface CreateEnterpriseRequest {
  legalName: string;
  cnpj: string;
  taxRegime?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  logoUrl?: string;
}

export interface CreateEnterpriseResponse {
  enterprise: Enterprise;
}

export class CreateEnterpriseUseCase {
  constructor(private enterprisesRepository: EnterprisesRepository) {}

  async execute(
    request: CreateEnterpriseRequest,
  ): Promise<CreateEnterpriseResponse> {
    const {
      legalName,
      cnpj,
      taxRegime,
      phone,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country,
      logoUrl,
    } = request;

    // Validate if CNPJ already exists (for active enterprises)
    const existingEnterprise =
      await this.enterprisesRepository.findByCnpj(cnpj);
    if (existingEnterprise) {
      throw new Error('Enterprise with this CNPJ already exists');
    }

    // Create enterprise
    const enterprise = await this.enterprisesRepository.create({
      legalName,
      cnpj,
      taxRegime,
      phone,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country,
      logoUrl,
    });

    return { enterprise };
  }
}
