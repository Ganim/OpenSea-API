import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface UpdateTemplateUseCaseRequest {
  id: string;
  name?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
}

interface UpdateTemplateUseCaseResponse {
  template: {
    id: string;
    name: string;
    productAttributes: Record<string, unknown>;
    variantAttributes: Record<string, unknown>;
    itemAttributes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
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

    // Validate that at least one attribute set is provided
    const finalProductAttributes =
      productAttributes ?? template.productAttributes;
    const finalVariantAttributes =
      variantAttributes ?? template.variantAttributes;
    const finalItemAttributes = itemAttributes ?? template.itemAttributes;

    const hasAttributes =
      Object.keys(finalProductAttributes).length > 0 ||
      Object.keys(finalVariantAttributes).length > 0 ||
      Object.keys(finalItemAttributes).length > 0;

    if (!hasAttributes) {
      throw new BadRequestError(
        'At least one attribute set (product, variant, or item) must be provided',
      );
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
      template: {
        id: updatedTemplate.id.toString(),
        name: updatedTemplate.name,
        productAttributes: updatedTemplate.productAttributes,
        variantAttributes: updatedTemplate.variantAttributes,
        itemAttributes: updatedTemplate.itemAttributes,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt ?? updatedTemplate.createdAt,
      },
    };
  }
}
