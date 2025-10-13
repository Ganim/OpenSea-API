import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface GetTemplateByIdUseCaseRequest {
  id: string;
}

interface GetTemplateByIdUseCaseResponse {
  template: {
    id: string;
    name: string;
    productAttributes: Record<string, unknown>;
    variantAttributes: Record<string, unknown>;
    itemAttributes: Record<string, unknown>;
  };
}

export class GetTemplateByIdUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(
    request: GetTemplateByIdUseCaseRequest,
  ): Promise<GetTemplateByIdUseCaseResponse> {
    const { id } = request;

    const template = await this.templatesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    return {
      template: {
        id: template.id.toString(),
        name: template.name,
        productAttributes: template.productAttributes,
        variantAttributes: template.variantAttributes,
        itemAttributes: template.itemAttributes,
      },
    };
  }
}
