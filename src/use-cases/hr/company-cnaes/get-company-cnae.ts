import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import type { CompanyAeRepository } from '@/repositories/hr/company-cnaes-repository';

export interface GetCompanyCnaeRequest {
  companyId: string;
  cnaeId: string;
  includeDeleted?: boolean;
}

export interface GetCompanyCnaeResponse {
  cnae: CompanyCnae;
}

export class GetCompanyCnaeUseCase {
  constructor(private companyCnaesRepository: CompanyAeRepository) {}

  async execute(
    request: GetCompanyCnaeRequest,
  ): Promise<GetCompanyCnaeResponse> {
    const companyId = new UniqueEntityID(request.companyId);
    const cnaeId = new UniqueEntityID(request.cnaeId);

    const cnae = await this.companyCnaesRepository.findById(cnaeId, {
      companyId,
      includeDeleted: request.includeDeleted,
    });

    if (!cnae) {
      throw new ResourceNotFoundError('CNAE not found');
    }

    return { cnae };
  }
}
