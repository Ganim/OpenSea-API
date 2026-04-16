import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ContractTemplatesRepository } from '@/repositories/hr/contract-templates-repository';

export interface DeleteContractTemplateRequest {
  tenantId: string;
  templateId: string;
}

export class DeleteContractTemplateUseCase {
  constructor(
    private contractTemplatesRepository: ContractTemplatesRepository,
  ) {}

  async execute(request: DeleteContractTemplateRequest): Promise<void> {
    const { tenantId, templateId } = request;

    const template = await this.contractTemplatesRepository.findById(
      new UniqueEntityID(templateId),
      tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Contract template not found');
    }

    await this.contractTemplatesRepository.delete(template.id);
  }
}
