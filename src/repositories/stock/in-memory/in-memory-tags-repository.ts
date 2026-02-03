import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Tag } from '@/entities/stock/tag';
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
