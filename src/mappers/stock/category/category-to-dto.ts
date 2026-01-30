import type { Category } from '@/entities/stock/category';

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  childrenCount: number;
  productCount: number;
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
    iconUrl: category.iconUrl,
    parentId: category.parentId?.toString() ?? null,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    childrenCount: category.childrenCount,
    productCount: category.productCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
  };
}
