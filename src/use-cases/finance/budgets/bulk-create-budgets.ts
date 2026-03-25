import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type FinanceBudgetDTO,
  financeBudgetToDTO,
} from '@/mappers/finance/finance-budget/finance-budget-to-dto';
import type { FinanceBudgetsRepository } from '@/repositories/finance/finance-budgets-repository';

interface MonthlyBudgetEntry {
  month: number;
  budgetAmount: number;
}

interface BulkCreateBudgetsUseCaseRequest {
  tenantId: string;
  categoryId: string;
  costCenterId?: string;
  year: number;
  monthlyBudgets: MonthlyBudgetEntry[];
  notes?: string;
}

interface BulkCreateBudgetsUseCaseResponse {
  budgets: FinanceBudgetDTO[];
  createdCount: number;
}

export class BulkCreateBudgetsUseCase {
  constructor(private financeBudgetsRepository: FinanceBudgetsRepository) {}

  async execute(
    request: BulkCreateBudgetsUseCaseRequest,
  ): Promise<BulkCreateBudgetsUseCaseResponse> {
    const { tenantId, categoryId, costCenterId, year, monthlyBudgets, notes } =
      request;

    if (year < 2000 || year > 2100) {
      throw new BadRequestError('Year must be between 2000 and 2100');
    }

    if (monthlyBudgets.length === 0) {
      throw new BadRequestError('At least one monthly budget is required');
    }

    for (const entry of monthlyBudgets) {
      if (entry.month < 1 || entry.month > 12) {
        throw new BadRequestError(
          `Invalid month: ${entry.month}. Must be between 1 and 12`,
        );
      }
      if (entry.budgetAmount <= 0) {
        throw new BadRequestError(
          `Budget amount for month ${entry.month} must be positive`,
        );
      }
    }

    // Check for duplicate months
    const uniqueMonths = new Set(monthlyBudgets.map((e) => e.month));
    if (uniqueMonths.size !== monthlyBudgets.length) {
      throw new BadRequestError('Duplicate months are not allowed');
    }

    const createdBudgets = [];

    for (const entry of monthlyBudgets) {
      const budget = await this.financeBudgetsRepository.upsert({
        tenantId,
        categoryId,
        costCenterId,
        year,
        month: entry.month,
        budgetAmount: entry.budgetAmount,
        notes,
      });
      createdBudgets.push(budget);
    }

    return {
      budgets: createdBudgets.map(financeBudgetToDTO),
      createdCount: createdBudgets.length,
    };
  }
}
