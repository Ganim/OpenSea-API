import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplateDTO } from '@/mappers/core/label-template/label-template-to-dto';
import { labelTemplateToDTO } from '@/mappers/core/label-template/label-template-to-dto';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface ListLabelTemplatesUseCaseRequest {
  tenantId: string;
  includeSystem?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListLabelTemplatesUseCaseResponse {
  templates: LabelTemplateDTO[];
  total: number;
}

export class ListLabelTemplatesUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: ListLabelTemplatesUseCaseRequest,
  ): Promise<ListLabelTemplatesUseCaseResponse> {
    const {
      tenantId,
      includeSystem = true,
      search,
      page = 1,
      limit = 50,
    } = request;

    const result = await this.labelTemplatesRepository.findMany({
      tenantId: new UniqueEntityID(tenantId),
      includeSystem,
      search,
      page,
      limit,
    });

    return {
      templates: result.templates.map(labelTemplateToDTO),
      total: result.total,
    };
  }
}
