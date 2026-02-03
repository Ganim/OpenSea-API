import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Category } from '@/entities/stock/category';

export interface CreateCategorySchema {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  parentId?: UniqueEntityID;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategorySchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string | null;
  parentId?: UniqueEntityID | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoriesRepository {
  create(data: CreateCategorySchema): Promise<Category>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Category | null>;
  findBySlug(slug: string, tenantId: string): Promise<Category | null>;
  findByName(name: string, tenantId: string): Promise<Category | null>;
  findMany(tenantId: string): Promise<Category[]>;
  findManyByParent(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<Category[]>;
  findManyRootCategories(tenantId: string): Promise<Category[]>;
  findManyActive(tenantId: string): Promise<Category[]>;
  update(data: UpdateCategorySchema): Promise<Category | null>;
  save(category: Category): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
