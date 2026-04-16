import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ContractTemplate,
  ContractTemplateTypeValue,
} from '@/entities/hr/contract-template';
import type { ContractTemplatesRepository } from '@/repositories/hr/contract-templates-repository';

export interface UpdateContractTemplateRequest {
  tenantId: string;
  templateId: string;
  name?: string;
  type?: ContractTemplateTypeValue;
  content?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateContractTemplateResponse {
  template: ContractTemplate;
}

export class UpdateContractTemplateUseCase {
  constructor(
    private contractTemplatesRepository: ContractTemplatesRepository,
  ) {}

  async execute(
    request: UpdateContractTemplateRequest,
  ): Promise<UpdateContractTemplateResponse> {
    const { tenantId, templateId, name, type, content, isActive, isDefault } =
      request;

    const existing = await this.contractTemplatesRepository.findById(
      new UniqueEntityID(templateId),
      tenantId,
    );
    if (!existing) {
      throw new ResourceNotFoundError('Contract template not found');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('Template name cannot be empty');
    }
    if (content !== undefined && content.trim().length === 0) {
      throw new BadRequestError('Template content cannot be empty');
    }

    // If marking this template as default, demote any previous default of the same type.
    if (isDefault === true) {
      const targetType = type ?? existing.type;
      const previousDefault =
        await this.contractTemplatesRepository.findDefaultByType(
          targetType,
          tenantId,
        );
      if (previousDefault && !previousDefault.id.equals(existing.id)) {
        previousDefault.unmarkAsDefault();
        await this.contractTemplatesRepository.save(previousDefault);
      }
    }

    const updated = await this.contractTemplatesRepository.update({
      id: new UniqueEntityID(templateId),
      name,
      type,
      content,
      isActive,
      isDefault,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Contract template not found');
    }

    return { template: updated };
  }
}
