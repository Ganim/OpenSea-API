import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { CareLabelInfo } from '@/entities/stock/template';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface CreateTemplateUseCaseRequest {
  name: string;
  unitOfMeasure?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
  careLabel?: CareLabelInfo;
}

interface CreateTemplateUseCaseResponse {
  template: TemplateDTO;
}

export class CreateTemplateUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(
    request: CreateTemplateUseCaseRequest,
  ): Promise<CreateTemplateUseCaseResponse> {
    const {
      name,
      unitOfMeasure,
      productAttributes,
      variantAttributes,
      itemAttributes,
      careLabel,
    } = request;

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Name is required');
    }

    if (name.length > 200) {
      throw new BadRequestError('Name must be at most 200 characters long');
    }

    // Validate unit of measure if provided
    const validUnits = ['METERS', 'KILOGRAMS', 'UNITS'];

    if (unitOfMeasure && !validUnits.includes(unitOfMeasure)) {
      throw new BadRequestError(
        'Invalid unit of measure. Must be one of: METERS, KILOGRAMS, UNITS',
      );
    }

    const templateUnitOfMeasure = UnitOfMeasure.create(
      (unitOfMeasure as 'METERS' | 'KILOGRAMS' | 'UNITS') ?? 'UNITS',
    );

    // Check if template with same name already exists
    const existingTemplate = await this.templatesRepository.findByName(name);
    if (existingTemplate) {
      throw new BadRequestError('Template with this name already exists');
    }

    // Save to repository
    const createdTemplate = await this.templatesRepository.create({
      name,
      unitOfMeasure: templateUnitOfMeasure,
      productAttributes: productAttributes ?? {},
      variantAttributes: variantAttributes ?? {},
      itemAttributes: itemAttributes ?? {},
      careLabel,
    });

    return {
      template: templateToDTO(createdTemplate),
    };
  }
}
