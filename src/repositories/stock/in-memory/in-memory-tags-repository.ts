import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Tag } from '@/entities/stock/tag';
import { filterByTokens } from '@/lib/tokenized-search';
import type {
  PaginatedResult,
  PaginationParams,
} from '@/repositories/pagination-params';
import type {
  CreateTagSchema,
  TagsRepository,
  UpdateTagSchema,
} from '../tags-repository';

export class InMemoryTagsRepository implements TagsRepository {
  public items: Tag[] = [];

  async create(data: CreateTagSchema): Promise<Tag> {
    const tag = Tag.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      slug: data.slug,
      color: data.color ?? null,
      description: data.description ?? null,
    });

    this.items.push(tag);
    return tag;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Tag | null> {
    const tag = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.tagId.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return tag ?? null;
  }

  async findBySlug(slug: string, tenantId: string): Promise<Tag | null> {
    const tag = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.slug === slug &&
        item.tenantId.toString() === tenantId,
    );
    return tag ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Tag | null> {
    const tag = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return tag ?? null;
  }

  async findMany(tenantId: string): Promise<Tag[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams & {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResult<Tag>> {
    const sortBy = params.sortBy ?? 'name';
    const sortOrder = params.sortOrder ?? 'asc';

    let filteredTags = this.items.filter(
      (tag) => !tag.deletedAt && tag.tenantId.toString() === tenantId,
    );

    filteredTags = filterByTokens(filteredTags, params.search, (tag, token) =>
      tag.name.toLowerCase().includes(token),
    );

    filteredTags.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortOrder === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    const total = filteredTags.length;
    const paginatedTags = filteredTags.slice(
      (params.page - 1) * params.limit,
      params.page * params.limit,
    );

    return {
      data: paginatedTags,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByNames(names: string[], tenantId: string): Promise<Tag[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        names.includes(item.name) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateTagSchema): Promise<Tag | null> {
    const tag = this.items.find(
      (item) => !item.deletedAt && item.tagId.equals(data.id),
    );
    if (!tag) return null;

    if (data.name !== undefined) tag.name = data.name;
    if (data.slug !== undefined) tag.slug = data.slug;
    if (data.color !== undefined) tag.color = data.color;
    if (data.description !== undefined) tag.description = data.description;

    return tag;
  }

  async save(tag: Tag): Promise<void> {
    const index = this.items.findIndex((i) => i.tagId.equals(tag.tagId));
    if (index >= 0) {
      this.items[index] = tag;
    } else {
      this.items.push(tag);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const tag = this.items.find(
      (item) => !item.deletedAt && item.tagId.equals(id),
    );
    if (tag) {
      tag.delete();
    }
  }
}
