import type { CostCenter } from '@/entities/finance/cost-center';

export interface CostCenterDTO {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function costCenterToDTO(costCenter: CostCenter): CostCenterDTO {
  return {
    id: costCenter.id.toString(),
    companyId: costCenter.companyId?.toString(),
    code: costCenter.code,
    name: costCenter.name,
    description: costCenter.description,
    isActive: costCenter.isActive,
    monthlyBudget: costCenter.monthlyBudget,
    annualBudget: costCenter.annualBudget,
    parentId: costCenter.parentId?.toString(),
    createdAt: costCenter.createdAt,
    updatedAt: costCenter.updatedAt,
    deletedAt: costCenter.deletedAt,
  };
}
