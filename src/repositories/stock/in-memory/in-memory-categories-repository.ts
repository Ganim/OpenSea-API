import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Category } from '@/entities/stock/category';
import type {
  CategoriesRepository,
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../categories-repository';

export class InMemoryCategoriesRepository implements CategoriesRepository {
  public items: Category[] = [];

  async create(data: CreateCategorySchema): Promise<Category> {
    const category = Category.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      iconUrl: data.iconUrl ?? null,
      parentId: data.parentId ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    this.items.push(category);
    return category;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Category | null> {
    const category = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return category ?? null;
  }

  async findBySlug(slug: string, tenantId: string): Promise<Category | null> {
    const category = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.slug === slug &&
        item.tenantId.toString() === tenantId,
    );
    return category ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Category | null> {
    const category = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return category ?? null;
  }

  async findMany(tenantId: string): Promise<Category[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyByParent(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<Category[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.parentId?.equals(parentId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyRootCategories(tenantId: string): Promise<Category[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.parentId === null &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyActive(tenantId: string): Promise<Category[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateCategorySchema): Promise<Category | null> {
    const category = this.items.find(
      (item) => !item.deletedAt && item.id.equals(data.id),
    );
    if (!category) return null;

    if (data.name !== undefined) category.name = data.name;
    if (data.slug !== undefined) category.slug = data.slug;
    if (data.description !== undefined) category.description = data.description;
    if (data.iconUrl !== undefined) category.iconUrl = data.iconUrl;
    if (data.parentId !== undefined) category.parentId = data.parentId;
    if (data.displayOrder !== undefined)
      category.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    return category;
  }

  async save(category: Category): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(category.id));
    if (index >= 0) {
      this.items[index] = category;
    } else {
      this.items.push(category);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const category = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (category) {
      category.delete();
    }
  }
}
