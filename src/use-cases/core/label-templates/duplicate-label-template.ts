import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplateDTO } from '@/mappers/core/label-template/label-template-to-dto';
import { labelTemplateToDTO } from '@/mappers/core/label-template/label-template-to-dto';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface DuplicateLabelTemplateUseCaseRequest {
  id: string;
  name?: string;
  tenantId: string;
  createdById: string;
}

interface DuplicateLabelTemplateUseCaseResponse {
  template: LabelTemplateDTO;
}

export class DuplicateLabelTemplateUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: DuplicateLabelTemplateUseCaseRequest,
  ): Promise<DuplicateLabelTemplateUseCaseResponse> {
    const { id, name, tenantId, createdById } = request;

    const sourceTemplate = await this.labelTemplatesRepository.findById(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(id),
    );

    if (!sourceTemplate) {
      throw new ResourceNotFoundError('Source label template not found');
    }

    const newName = name?.trim() || `${sourceTemplate.name} (Cópia)`;

    if (newName.length > 255) {
      throw new BadRequestError('Name must be at most 255 characters long');
    }

    const tenantEntityId = new UniqueEntityID(tenantId);
    const existingTemplate =
      await this.labelTemplatesRepository.findByNameAndTenant(
        newName,
        tenantEntityId,
      );

    if (existingTemplate) {
      throw new BadRequestError(
        'A template with this name already exists in your organization',
      );
    }

    const duplicatedTemplate = await this.labelTemplatesRepository.create({
      name: newName,
      description: sourceTemplate.description,
      isSystem: false,
      width: sourceTemplate.width,
      height: sourceTemplate.height,
      grapesJsData: sourceTemplate.grapesJsData,
      compiledHtml: sourceTemplate.compiledHtml,
      compiledCss: sourceTemplate.compiledCss,
      tenantId: tenantEntityId,
      createdById: new UniqueEntityID(createdById),
    });

    return {
      template: labelTemplateToDTO(duplicatedTemplate),
    };
  }
}
