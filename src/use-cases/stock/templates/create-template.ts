import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface CreateTemplateUseCaseRequest {
  name: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}

interface CreateTemplateUseCaseResponse {
  template: TemplateDTO;
}

export class CreateTemplateUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(
    request: CreateTemplateUseCaseRequest,
  ): Promise<CreateTemplateUseCaseResponse> {
    const { name, productAttributes, variantAttributes, itemAttributes } =
      request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (name.length > 200) {
      throw new BadRequestError('Name must be at most 200 characters long');
    }

    // Check if template with same name already exists
    const existingTemplate = await this.templatesRepository.findByName(name);
    if (existingTemplate) {
      throw new BadRequestError('Template with this name already exists');
    }

    // Save to repository
    const createdTemplate = await this.templatesRepository.create({
      name,
      productAttributes: productAttributes ?? {},
      variantAttributes: variantAttributes ?? {},
      itemAttributes: itemAttributes ?? {},
    });

    return {
      template: templateToDTO(createdTemplate),
    };
  }
}
