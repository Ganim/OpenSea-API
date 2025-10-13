import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    this.items.push(category);
    return category;
  }

  async findById(id: UniqueEntityID): Promise<Category | null> {
    const category = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return category ?? null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = this.items.find(
      (item) => !item.deletedAt && item.slug === slug,
    );
    return category ?? null;
  }

  async findByName(name: string): Promise<Category | null> {
    const category = this.items.find(
      (item) => !item.deletedAt && item.name === name,
    );
    return category ?? null;
  }

  async findMany(): Promise<Category[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyByParent(parentId: UniqueEntityID): Promise<Category[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.parentId?.equals(parentId),
    );
  }

  async findManyRootCategories(): Promise<Category[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.parentId === null,
    );
  }

  async findManyActive(): Promise<Category[]> {
    return this.items.filter((item) => !item.deletedAt && item.isActive);
  }

  async update(data: UpdateCategorySchema): Promise<Category | null> {
    const category = await this.findById(data.id);
    if (!category) return null;

    if (data.name !== undefined) category.name = data.name;
    if (data.slug !== undefined) category.slug = data.slug;
    if (data.description !== undefined) category.description = data.description;
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
    const category = await this.findById(id);
    if (category) {
      category.delete();
    }
  }
}
