import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedContent } from '@/entities/sales/generated-content';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  GeneratedContentsRepository,
  FindManyGeneratedContentsParams,
} from '@/repositories/sales/generated-contents-repository';

export class InMemoryGeneratedContentsRepository implements GeneratedContentsRepository {
  public items: GeneratedContent[] = [];

  async create(content: GeneratedContent): Promise<void> {
    this.items.push(content);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedContent | null> {
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId &&
          !c.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyGeneratedContentsParams,
  ): Promise<PaginatedResult<GeneratedContent>> {
    let filtered = this.items.filter(
      (c) => c.tenantId.toString() === params.tenantId && !c.isDeleted,
    );

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          c.content.toLowerCase().includes(s),
      );
    }

    if (params.type) {
      filtered = filtered.filter((c) => c.type === params.type);
    }

    if (params.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    if (params.productId) {
      filtered = filtered.filter(
        (c) => c.productId?.toString() === params.productId,
      );
    }

    if (params.catalogId) {
      filtered = filtered.filter(
        (c) => c.catalogId?.toString() === params.catalogId,
      );
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(content: GeneratedContent): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === content.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = content;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === id.toString(),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
