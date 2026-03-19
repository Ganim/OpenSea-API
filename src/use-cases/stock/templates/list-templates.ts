import type { TemplateDTO } from '@/mappers/stock/template/template-to-dto';
import { templateToDTO } from '@/mappers/stock/template/template-to-dto';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface ListTemplatesUseCaseRequest {
  tenantId: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ListTemplatesUseCaseResponse {
  templates: TemplateDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListTemplatesUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(
    request: ListTemplatesUseCaseRequest,
  ): Promise<ListTemplatesUseCaseResponse> {
    const { tenantId, search, sortBy, sortOrder } = request;
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const result = await this.templatesRepository.findManyPaginated(tenantId, {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    return {
      templates: result.data.map(templateToDTO),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
      },
    };
  }
}
