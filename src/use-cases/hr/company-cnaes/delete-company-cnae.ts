import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAeRepository } from '@/repositories/hr/company-cnaes-repository';

export interface DeleteCompanyCnaeRequest {
  companyId: string;
  cnaeId: string;
}

export class DeleteCompanyCnaeUseCase {
  constructor(private companyCnaesRepository: CompanyAeRepository) {}

  async execute(request: DeleteCompanyCnaeRequest): Promise<void> {
    const companyId = new UniqueEntityID(request.companyId);
    const cnaeId = new UniqueEntityID(request.cnaeId);

    const cnae = await this.companyCnaesRepository.findById(cnaeId, {
      companyId,
    });

    if (!cnae) {
      throw new ResourceNotFoundError('CNAE not found');
    }

    await this.companyCnaesRepository.delete(cnaeId);
  }
}
