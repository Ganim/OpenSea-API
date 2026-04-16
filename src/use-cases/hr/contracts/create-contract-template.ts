import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ContractTemplate } from '@/entities/hr/contract-template';
import type { ContractTemplateTypeValue } from '@/entities/hr/contract-template';
import type { ContractTemplatesRepository } from '@/repositories/hr/contract-templates-repository';

export interface CreateContractTemplateRequest {
  tenantId: string;
  name: string;
  type: ContractTemplateTypeValue;
  content: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateContractTemplateResponse {
  template: ContractTemplate;
}

/**
 * Creates a new contract template. When `isDefault` is true the use case
 * also clears the previous default for the same type, so there is at
 * most one default template per type.
 */
export class CreateContractTemplateUseCase {
  constructor(
    private contractTemplatesRepository: ContractTemplatesRepository,
  ) {}

  async execute(
    request: CreateContractTemplateRequest,
  ): Promise<CreateContractTemplateResponse> {
    const { tenantId, name, type, content, isActive, isDefault } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Template name is required');
    }
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Template content is required');
    }

    if (isDefault) {
      const previousDefault =
        await this.contractTemplatesRepository.findDefaultByType(
          type,
          tenantId,
        );
      if (previousDefault) {
        previousDefault.unmarkAsDefault();
        await this.contractTemplatesRepository.save(previousDefault);
      }
    }

    const template = await this.contractTemplatesRepository.create({
      tenantId,
      name,
      type,
      content,
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
    });

    return { template };
  }
}
