import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Combo,
  ComboDiscountType,
  ComboItemProps,
  ComboType,
} from '@/entities/sales/combo';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreateComboSchema {
  tenantId: string;
  name: string;
  description?: string;
  type: ComboType;
  discountType: ComboDiscountType;
  discountValue: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  items?: ComboItemProps[];
  categoryIds?: string[];
  minItems?: number;
  maxItems?: number;
}

export interface UpdateComboSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  description?: string;
  type?: ComboType;
  discountType?: ComboDiscountType;
  discountValue?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  items?: ComboItemProps[];
  categoryIds?: string[];
  minItems?: number;
  maxItems?: number;
}

export interface FindManyCombosParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  type?: ComboType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CombosRepository {
  create(data: CreateComboSchema): Promise<Combo>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Combo | null>;
  findManyPaginated(
    params: FindManyCombosParams,
  ): Promise<PaginatedResult<Combo>>;
  update(data: UpdateComboSchema): Promise<Combo | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
