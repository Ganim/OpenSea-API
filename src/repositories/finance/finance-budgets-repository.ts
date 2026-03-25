import type { FinanceBudget } from '@/entities/finance/finance-budget';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateFinanceBudgetSchema {
  tenantId: string;
  categoryId: string;
  costCenterId?: string;
  year: number;
  month: number;
  budgetAmount: number;
  notes?: string;
}

export interface UpdateFinanceBudgetSchema {
  id: string;
  tenantId: string;
  budgetAmount?: number;
  notes?: string | null;
}

export interface FindManyFinanceBudgetsOptions {
  tenantId: string;
  year?: number;
  categoryId?: string;
  costCenterId?: string;
  page?: number;
  limit?: number;
}

export interface FindManyFinanceBudgetsResult {
  budgets: FinanceBudget[];
  total: number;
}

export interface BudgetActualRow {
  categoryId: string;
  categoryName: string;
  costCenterId: string | null;
  costCenterName: string | null;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET';
}

export interface FinanceBudgetsRepository {
  create(
    data: CreateFinanceBudgetSchema,
    tx?: TransactionClient,
  ): Promise<FinanceBudget>;

  findById(id: string, tenantId: string): Promise<FinanceBudget | null>;

  findMany(
    options: FindManyFinanceBudgetsOptions,
  ): Promise<FindManyFinanceBudgetsResult>;

  update(data: UpdateFinanceBudgetSchema): Promise<FinanceBudget | null>;

  delete(id: string, tenantId: string): Promise<void>;

  upsert(
    data: CreateFinanceBudgetSchema,
    tx?: TransactionClient,
  ): Promise<FinanceBudget>;

  getBudgetVsActual(
    tenantId: string,
    year: number,
    month: number,
    costCenterId?: string,
  ): Promise<BudgetActualRow[]>;
}
