import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CostCenter } from '@/entities/finance/cost-center';

export interface CreateCostCenterSchema {
  tenantId: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
}

export interface UpdateCostCenterSchema {
  id: UniqueEntityID;
  tenantId: string;
  companyId?: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
}

export interface FindManyPaginatedResult {
  costCenters: CostCenter[];
  total: number;
}

// P1-37: optional filters from the controller. Legacy callers omit them.
export interface FindManyCostCentersFilters {
  search?: string;
  isActive?: boolean;
  companyId?: string;
  includeDeleted?: boolean | 'only';
  sortBy?: 'name' | 'code' | 'createdAt' | 'monthlyBudget' | 'annualBudget';
  sortOrder?: 'asc' | 'desc';
}

export interface CostCentersRepository {
  create(data: CreateCostCenterSchema): Promise<CostCenter>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CostCenter | null>;
  findByCode(code: string, tenantId: string): Promise<CostCenter | null>;
  findMany(tenantId: string): Promise<CostCenter[]>;
  findManyPaginated(
    tenantId: string,
    page: number,
    limit: number,
    filters?: FindManyCostCentersFilters,
  ): Promise<FindManyPaginatedResult>;
  update(data: UpdateCostCenterSchema): Promise<CostCenter | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
