import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface TemplateDTO {
  id: string;
  name: string;
  productAttributes: Record<string, unknown>;
  variantAttributes: Record<string, unknown>;
  itemAttributes: Record<string, unknown>;
}

interface ListTemplatesUseCaseResponse {
  templates: TemplateDTO[];
}

export class ListTemplatesUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(): Promise<ListTemplatesUseCaseResponse> {
    const templates = await this.templatesRepository.findMany();

    return {
      templates: templates.map((template) => ({
        id: template.id.toString(),
        name: template.name,
        productAttributes: template.productAttributes,
        variantAttributes: template.variantAttributes,
        itemAttributes: template.itemAttributes,
      })),
    };
  }
}
