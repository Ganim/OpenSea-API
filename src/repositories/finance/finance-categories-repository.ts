import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceCategory } from '@/entities/finance/finance-category';

export interface CreateFinanceCategorySchema {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type: string;
  parentId?: string;
  chartOfAccountId?: string;
  displayOrder?: number;
  isActive?: boolean;
  isSystem?: boolean;
  interestRate?: number;
  penaltyRate?: number;
}

export interface UpdateFinanceCategorySchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type?: string;
  parentId?: string;
  chartOfAccountId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  interestRate?: number;
  penaltyRate?: number;
}

// P1-36: optional filters honored by `findMany`. Legacy callers pass none.
export interface FindManyFinanceCategoriesFilters {
  type?: string;
  isActive?: boolean;
  parentId?: string;
}

export interface FinanceCategoriesRepository {
  create(data: CreateFinanceCategorySchema): Promise<FinanceCategory>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceCategory | null>;
  findBySlug(slug: string, tenantId: string): Promise<FinanceCategory | null>;
  findByName(name: string, tenantId: string): Promise<FinanceCategory | null>;
  findMany(
    tenantId: string,
    filters?: FindManyFinanceCategoriesFilters,
  ): Promise<FinanceCategory[]>;
  findByParentId(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceCategory[]>;
  countEntriesByCategoryId(
    categoryId: string,
    tenantId: string,
  ): Promise<number>;
  migrateEntries(
    fromCategoryId: string,
    toCategoryId: string,
    tenantId: string,
  ): Promise<void>;
  update(data: UpdateFinanceCategorySchema): Promise<FinanceCategory | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
