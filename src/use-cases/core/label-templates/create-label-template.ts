import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplateDTO } from '@/mappers/core/label-template/label-template-to-dto';
import { labelTemplateToDTO } from '@/mappers/core/label-template/label-template-to-dto';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface CreateLabelTemplateUseCaseRequest {
  name: string;
  description?: string;
  width: number;
  height: number;
  grapesJsData: string;
  compiledHtml?: string;
  compiledCss?: string;
  tenantId: string;
  createdById: string;
}

interface CreateLabelTemplateUseCaseResponse {
  template: LabelTemplateDTO;
}

export class CreateLabelTemplateUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: CreateLabelTemplateUseCaseRequest,
  ): Promise<CreateLabelTemplateUseCaseResponse> {
    const {
      name,
      description,
      width,
      height,
      grapesJsData,
      compiledHtml,
      compiledCss,
      tenantId,
      createdById,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (name.length > 255) {
      throw new BadRequestError('Name must be at most 255 characters long');
    }

    if (width < 10 || width > 300) {
      throw new BadRequestError('Width must be between 10 and 300 mm');
    }

    if (height < 10 || height > 300) {
      throw new BadRequestError('Height must be between 10 and 300 mm');
    }

    if (!grapesJsData || grapesJsData.trim().length === 0) {
      throw new BadRequestError('GrapesJS data is required');
    }

    try {
      JSON.parse(grapesJsData);
    } catch {
      throw new BadRequestError('GrapesJS data must be valid JSON');
    }

    const tenantEntityId = new UniqueEntityID(tenantId);
    const existingTemplate =
      await this.labelTemplatesRepository.findByNameAndTenant(
        name,
        tenantEntityId,
      );

    if (existingTemplate) {
      throw new BadRequestError(
        'A template with this name already exists in your organization',
      );
    }

    const createdTemplate = await this.labelTemplatesRepository.create({
      name: name.trim(),
      description: description?.trim(),
      width,
      height,
      grapesJsData,
      compiledHtml,
      compiledCss,
      tenantId: tenantEntityId,
      createdById: new UniqueEntityID(createdById),
    });

    return {
      template: labelTemplateToDTO(createdTemplate),
    };
  }
}
