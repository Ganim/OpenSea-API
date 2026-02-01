import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplateDTO } from '@/mappers/core/label-template/label-template-to-dto';
import { labelTemplateToDTO } from '@/mappers/core/label-template/label-template-to-dto';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface UpdateLabelTemplateUseCaseRequest {
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  grapesJsData?: string;
  compiledHtml?: string;
  compiledCss?: string;
}

interface UpdateLabelTemplateUseCaseResponse {
  template: LabelTemplateDTO;
}

export class UpdateLabelTemplateUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: UpdateLabelTemplateUseCaseRequest,
  ): Promise<UpdateLabelTemplateUseCaseResponse> {
    const {
      id,
      organizationId,
      name,
      description,
      width,
      height,
      grapesJsData,
      compiledHtml,
      compiledCss,
    } = request;

    const templateId = new UniqueEntityID(id);
    const existingTemplate = await this.labelTemplatesRepository.findById(
      new UniqueEntityID(organizationId),
      templateId,
    );

    if (!existingTemplate) {
      throw new ResourceNotFoundError('Label template not found');
    }

    if (existingTemplate.isSystem) {
      throw new BadRequestError('Cannot edit system templates');
    }

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name cannot be empty');
      }

      if (name.length > 255) {
        throw new BadRequestError('Name must be at most 255 characters long');
      }

      const templateWithSameName =
        await this.labelTemplatesRepository.findByNameAndOrganization(
          name,
          existingTemplate.organizationId,
        );

      if (templateWithSameName && !templateWithSameName.id.equals(templateId)) {
        throw new BadRequestError(
          'A template with this name already exists in your organization',
        );
      }
    }

    if (width !== undefined && (width < 10 || width > 300)) {
      throw new BadRequestError('Width must be between 10 and 300 mm');
    }

    if (height !== undefined && (height < 10 || height > 300)) {
      throw new BadRequestError('Height must be between 10 and 300 mm');
    }

    if (grapesJsData !== undefined) {
      if (!grapesJsData || grapesJsData.trim().length === 0) {
        throw new BadRequestError('GrapesJS data cannot be empty');
      }

      try {
        JSON.parse(grapesJsData);
      } catch {
        throw new BadRequestError('GrapesJS data must be valid JSON');
      }
    }

    const updatedTemplate = await this.labelTemplatesRepository.update({
      id: templateId,
      organizationId: new UniqueEntityID(organizationId),
      name: name?.trim(),
      description: description?.trim(),
      width,
      height,
      grapesJsData,
      compiledHtml,
      compiledCss,
    });

    if (!updatedTemplate) {
      throw new ResourceNotFoundError('Label template not found');
    }

    return {
      template: labelTemplateToDTO(updatedTemplate),
    };
  }
}
