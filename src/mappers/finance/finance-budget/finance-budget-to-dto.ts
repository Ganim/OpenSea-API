import type { FinanceBudget } from '@/entities/finance/finance-budget';

export interface FinanceBudgetDTO {
  id: string;
  tenantId: string;
  categoryId: string;
  costCenterId?: string;
  year: number;
  month: number;
  budgetAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function financeBudgetToDTO(budget: FinanceBudget): FinanceBudgetDTO {
  return {
    id: budget.id.toString(),
    tenantId: budget.tenantId.toString(),
    categoryId: budget.categoryId.toString(),
    costCenterId: budget.costCenterId?.toString(),
    year: budget.year,
    month: budget.month,
    budgetAmount: budget.budgetAmount,
    notes: budget.notes,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}
