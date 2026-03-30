import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEItem, PPECategory } from '@/entities/hr/ppe-item';

export interface CreatePPEItemSchema {
  tenantId: string;
  name: string;
  category: string;
  caNumber?: string;
  manufacturer?: string;
  model?: string;
  expirationMonths?: number;
  minStock?: number;
  currentStock?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePPEItemSchema {
  id: UniqueEntityID;
  name?: string;
  category?: string;
  caNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  expirationMonths?: number | null;
  minStock?: number;
  isActive?: boolean;
  notes?: string | null;
}

export interface AdjustPPEItemStockSchema {
  id: UniqueEntityID;
  adjustment: number; // positive to add, negative to subtract
}

export interface FindPPEItemFilters {
  category?: PPECategory;
  isActive?: boolean;
  lowStockOnly?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PPEItemsRepository {
  create(data: CreatePPEItemSchema): Promise<PPEItem>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PPEItem | null>;
  findMany(
    tenantId: string,
    filters?: FindPPEItemFilters,
  ): Promise<{ ppeItems: PPEItem[]; total: number }>;
  update(data: UpdatePPEItemSchema): Promise<PPEItem | null>;
  adjustStock(data: AdjustPPEItemStockSchema): Promise<PPEItem | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
