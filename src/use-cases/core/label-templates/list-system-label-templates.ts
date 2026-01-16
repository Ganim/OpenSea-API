import type { LabelTemplateDTO } from '@/mappers/core/label-template/label-template-to-dto';
import { labelTemplateToDTO } from '@/mappers/core/label-template/label-template-to-dto';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface ListSystemLabelTemplatesUseCaseResponse {
  templates: LabelTemplateDTO[];
  total: number;
}

export class ListSystemLabelTemplatesUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(): Promise<ListSystemLabelTemplatesUseCaseResponse> {
    const templates = await this.labelTemplatesRepository.findSystemTemplates();

    return {
      templates: templates.map(labelTemplateToDTO),
      total: templates.length,
    };
  }
}
