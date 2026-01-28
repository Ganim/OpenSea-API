import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  CareLabelInfo,
  TemplateAttributesMap,
} from '@/entities/stock/template';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface CreateTemplateUseCaseRequest {
  code?: string; // Código hierárquico manual (3 dígitos: 001) - auto-gerado se não fornecido
  name: string;
  iconUrl?: string;
  unitOfMeasure?: string;
  productAttributes?: TemplateAttributesMap;
  variantAttributes?: TemplateAttributesMap;
  itemAttributes?: TemplateAttributesMap;
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
      code,
      name,
      iconUrl,
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

    // Validate code format if provided
    if (code) {
      if (!/^\d{3}$/.test(code)) {
        throw new BadRequestError(
          'Code must be exactly 3 digits (e.g., 001, 042)',
        );
      }
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

    // Save to repository - code will be auto-generated from sequentialCode if not provided
    // The code generation happens after create to get the sequentialCode
    const createdTemplate = await this.templatesRepository.create({
      code, // Will be set in repository or left undefined for auto-generation
      name,
      iconUrl,
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
