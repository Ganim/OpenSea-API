import type { Category } from '@/entities/stock/category';

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function categoryToDTO(category: Category): CategoryDTO {
  return {
    id: category.categoryId.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parentId?.toString() ?? null,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
  };
}
