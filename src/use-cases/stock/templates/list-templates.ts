import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface ListTemplatesUseCaseResponse {
  templates: TemplateDTO[];
}

export class ListTemplatesUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(): Promise<ListTemplatesUseCaseResponse> {
    const templates = await this.templatesRepository.findMany();

    return {
      templates: templates.map(templateToDTO),
    };
  }
}
