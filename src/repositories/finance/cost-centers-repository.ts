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
  companyId?: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
}

export interface CostCentersRepository {
  create(data: CreateCostCenterSchema): Promise<CostCenter>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CostCenter | null>;
  findByCode(code: string, tenantId: string): Promise<CostCenter | null>;
  findMany(tenantId: string): Promise<CostCenter[]>;
  update(data: UpdateCostCenterSchema): Promise<CostCenter | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
