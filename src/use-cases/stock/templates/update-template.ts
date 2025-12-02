import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface UpdateTemplateUseCaseRequest {
  id: string;
  name?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}

interface UpdateTemplateUseCaseResponse {
  template: TemplateDTO;
}

export class UpdateTemplateUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(
    request: UpdateTemplateUseCaseRequest,
  ): Promise<UpdateTemplateUseCaseResponse> {
    const { id, name, productAttributes, variantAttributes, itemAttributes } =
      request;

    // Validate ID
    const template = await this.templatesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name is required');
      }

      if (name.length > 200) {
        throw new BadRequestError('Name must be at most 200 characters long');
      }

      // Check if name is already used by another template
      if (name !== template.name) {
        const existingTemplate =
          await this.templatesRepository.findByName(name);
        if (existingTemplate && !existingTemplate.id.equals(template.id)) {
          throw new BadRequestError('Template with this name already exists');
        }
      }
    }

    // Update template
    const updatedTemplate = await this.templatesRepository.update({
      id: new UniqueEntityID(id),
      name,
      productAttributes,
      variantAttributes,
      itemAttributes,
    });

    if (!updatedTemplate) {
      throw new ResourceNotFoundError('Template not found');
    }

    return {
      template: templateToDTO(updatedTemplate),
    };
  }
}
