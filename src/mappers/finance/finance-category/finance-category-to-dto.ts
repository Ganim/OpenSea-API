import type { FinanceCategory } from '@/entities/finance/finance-category';

export interface FinanceCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function financeCategoryToDTO(category: FinanceCategory): FinanceCategoryDTO {
  return {
    id: category.id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    iconUrl: category.iconUrl,
    color: category.color,
    type: category.type,
    parentId: category.parentId?.toString(),
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    isSystem: category.isSystem,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
  };
}
