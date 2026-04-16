import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContractTemplate } from '@/entities/hr/contract-template';
import type { ContractTemplatesRepository } from '@/repositories/hr/contract-templates-repository';

export interface GetContractTemplateRequest {
  tenantId: string;
  templateId: string;
}

export interface GetContractTemplateResponse {
  template: ContractTemplate;
}

export class GetContractTemplateUseCase {
  constructor(
    private contractTemplatesRepository: ContractTemplatesRepository,
  ) {}

  async execute(
    request: GetContractTemplateRequest,
  ): Promise<GetContractTemplateResponse> {
    const { tenantId, templateId } = request;

    const template = await this.contractTemplatesRepository.findById(
      new UniqueEntityID(templateId),
      tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Contract template not found');
    }

    return { template };
  }
}
