import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceCategory } from '@/entities/finance/finance-category';
import type {
  FinanceCategoriesRepository,
  CreateFinanceCategorySchema,
  FindManyFinanceCategoriesFilters,
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
      chartOfAccountId: data.chartOfAccountId,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
      isSystem: data.isSystem ?? false,
      interestRate: data.interestRate,
      penaltyRate: data.penaltyRate,
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

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<FinanceCategory | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt && i.name === name && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(
    tenantId: string,
    filters?: FindManyFinanceCategoriesFilters,
  ): Promise<FinanceCategory[]> {
    return this.items.filter((i) => {
      if (i.deletedAt) return false;
      if (i.tenantId.toString() !== tenantId) return false;
      // P1-36: mirror Prisma filters so unit specs behave identically.
      if (filters?.type && i.type !== filters.type) return false;
      if (filters?.isActive !== undefined && i.isActive !== filters.isActive)
        return false;
      if (
        filters?.parentId &&
        i.parentId?.toString() !== filters.parentId
      )
        return false;
      return true;
    });
  }

  async findByParentId(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceCategory[]> {
    return this.items.filter(
      (i) =>
        !i.deletedAt &&
        i.parentId?.equals(parentId) &&
        i.tenantId.toString() === tenantId,
    );
  }

  // Track entries for testing entry migration
  public entryCounts: Map<string, number> = new Map();
  public entryMigrations: Array<{
    from: string;
    to: string;
    tenantId: string;
  }> = [];

  async countEntriesByCategoryId(
    categoryId: string,
    _tenantId: string,
  ): Promise<number> {
    return this.entryCounts.get(categoryId) ?? 0;
  }

  async migrateEntries(
    fromCategoryId: string,
    toCategoryId: string,
    tenantId: string,
  ): Promise<void> {
    this.entryMigrations.push({
      from: fromCategoryId,
      to: toCategoryId,
      tenantId,
    });
    const count = this.entryCounts.get(fromCategoryId) ?? 0;
    if (count > 0) {
      const existing = this.entryCounts.get(toCategoryId) ?? 0;
      this.entryCounts.set(toCategoryId, existing + count);
      this.entryCounts.set(fromCategoryId, 0);
    }
  }

  async update(
    data: UpdateFinanceCategorySchema,
  ): Promise<FinanceCategory | null> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt &&
        i.id.equals(data.id) &&
        i.tenantId.toString() === data.tenantId,
    );
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
    if (data.chartOfAccountId !== undefined)
      item.chartOfAccountId = data.chartOfAccountId ?? undefined;
    if (data.displayOrder !== undefined) item.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) item.isActive = data.isActive;
    if (data.interestRate !== undefined) item.interestRate = data.interestRate;
    if (data.penaltyRate !== undefined) item.penaltyRate = data.penaltyRate;

    return item;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const item = this.items.find(
      (i) =>
        !i.deletedAt &&
        i.id.equals(id) &&
        i.tenantId.toString() === tenantId,
    );
    if (item) item.delete();
  }
}
