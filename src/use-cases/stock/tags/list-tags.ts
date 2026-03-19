import type { Tag } from '@/entities/stock/tag';
import type { TagDTO } from '@/mappers/stock/tag/tag-to-dto';
import { tagToDTO } from '@/mappers/stock/tag/tag-to-dto';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface ListTagsUseCaseRequest {
  tenantId: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ListTagsUseCaseResponse {
  tags: TagDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListTagsUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute(
    request: ListTagsUseCaseRequest,
  ): Promise<ListTagsUseCaseResponse> {
    const { tenantId, search, sortBy, sortOrder } = request;
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const paginatedResult = await this.tagsRepository.findManyPaginated(
      tenantId,
      {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      },
    );

    return this.buildResponse(
      paginatedResult.data,
      paginatedResult.total,
      paginatedResult.page,
      paginatedResult.limit,
      paginatedResult.totalPages,
    );
  }

  private buildResponse(
    tags: Tag[],
    total: number,
    page: number,
    limit: number,
    pages: number,
  ): ListTagsUseCaseResponse {
    return {
      tags: tags.map(tagToDTO),
      meta: { total, page, limit, pages },
    };
  }
}
