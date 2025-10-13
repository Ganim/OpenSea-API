import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Category } from '@/entities/stock/category';

export interface CreateCategorySchema {
  name: string;
  slug: string;
  description?: string;
  parentId?: UniqueEntityID;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategorySchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  description?: string;
  parentId?: UniqueEntityID | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoriesRepository {
  create(data: CreateCategorySchema): Promise<Category>;
  findById(id: UniqueEntityID): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findMany(): Promise<Category[]>;
  findManyByParent(parentId: UniqueEntityID): Promise<Category[]>;
  findManyRootCategories(): Promise<Category[]>;
  findManyActive(): Promise<Category[]>;
  update(data: UpdateCategorySchema): Promise<Category | null>;
  save(category: Category): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
