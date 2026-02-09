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
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateFinanceCategorySchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface FinanceCategoriesRepository {
  create(data: CreateFinanceCategorySchema): Promise<FinanceCategory>;
  findById(id: UniqueEntityID, tenantId: string): Promise<FinanceCategory | null>;
  findBySlug(slug: string, tenantId: string): Promise<FinanceCategory | null>;
  findMany(tenantId: string): Promise<FinanceCategory[]>;
  update(data: UpdateFinanceCategorySchema): Promise<FinanceCategory | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
