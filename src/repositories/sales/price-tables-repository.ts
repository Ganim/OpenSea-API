import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PriceTable } from '@/entities/sales/price-table';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreatePriceTableSchema {
  tenantId: string;
  name: string;
  description?: string;
  type?: string;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

export interface UpdatePriceTableSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  description?: string;
  type?: string;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

export interface FindManyPriceTablesParams {
  tenantId: string;
  page: number;
  limit: number;
  type?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PriceTableRuleData {
  id: string;
  priceTableId: string;
  tenantId: string;
  ruleType:
    | 'CUSTOMER_TYPE'
    | 'REGION'
    | 'CHANNEL'
    | 'CUSTOMER_TAG'
    | 'MIN_QUANTITY';
  operator: 'EQUALS' | 'IN' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN';
  value: string;
  createdAt: Date;
}

export interface PriceTableWithRules {
  table: PriceTable;
  rules: PriceTableRuleData[];
}

export interface PriceTablesRepository {
  create(data: CreatePriceTableSchema): Promise<PriceTable>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PriceTable | null>;
  findByName(name: string, tenantId: string): Promise<PriceTable | null>;
  findDefault(tenantId: string): Promise<PriceTable | null>;
  findManyPaginated(
    params: FindManyPriceTablesParams,
  ): Promise<PaginatedResult<PriceTable>>;
  findActiveWithRulesByTenant(tenantId: string): Promise<PriceTableWithRules[]>;
  update(data: UpdatePriceTableSchema): Promise<PriceTable | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
