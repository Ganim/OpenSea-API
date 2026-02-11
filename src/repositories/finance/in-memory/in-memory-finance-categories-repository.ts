import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceCategory } from '@/entities/finance/finance-category';
import type {
  FinanceCategoriesRepository,
  CreateFinanceCategorySchema,
  UpdateFinanceCategorySchema,
} from '../finance-categories-repository';

export class InMemoryFinanceCategoriesRepository
  implements FinanceCategoriesRepository
{
  public items: FinanceCategory[] = [];

  async create(data: CreateFinanceCategorySchema): Promise<FinanceCategory> {
    const category = FinanceCategory.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      slug: data.slug,
      description: data.description,
      iconUrl: data.iconUrl,
      color: data.color,
      type: data.type,
      parentId: data.parentId ? new UniqueEntityID(data.parentId) : undefined,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    this.items.push(category);
    return category;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceCategory | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findBySlug(
    slug: string,
    tenantId: string,
  ): Promise<FinanceCategory | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.slug === slug && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<FinanceCategory[]> {
    return this.items.filter(
      (i) => !i.deletedAt && i.tenantId.toString() === tenantId,
    );
  }

  async update(
    data: UpdateFinanceCategorySchema,
  ): Promise<FinanceCategory | null> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(data.id));
    if (!item) return null;

    if (data.name !== undefined) item.name = data.name;
    if (data.slug !== undefined) item.slug = data.slug;
    if (data.description !== undefined) item.description = data.description;
    if (data.iconUrl !== undefined) item.iconUrl = data.iconUrl;
    if (data.color !== undefined) item.color = data.color;
    if (data.type !== undefined) item.type = data.type;
    if (data.parentId !== undefined)
      item.parentId = data.parentId
        ? new UniqueEntityID(data.parentId)
        : undefined;
    if (data.displayOrder !== undefined) item.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) item.isActive = data.isActive;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((i) => !i.deletedAt && i.id.equals(id));
    if (item) item.delete();
  }
}
