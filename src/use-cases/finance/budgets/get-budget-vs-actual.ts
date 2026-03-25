import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type {
  BudgetActualRow,
  FinanceBudgetsRepository,
} from '@/repositories/finance/finance-budgets-repository';

interface GetBudgetVsActualUseCaseRequest {
  tenantId: string;
  year: number;
  month: number;
  costCenterId?: string;
}

interface BudgetVsActualTotals {
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  overallStatus: 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET';
}

interface GetBudgetVsActualUseCaseResponse {
  rows: BudgetActualRow[];
  totals: BudgetVsActualTotals;
}

export class GetBudgetVsActualUseCase {
  constructor(private financeBudgetsRepository: FinanceBudgetsRepository) {}

  async execute(
    request: GetBudgetVsActualUseCaseRequest,
  ): Promise<GetBudgetVsActualUseCaseResponse> {
    const { tenantId, year, month, costCenterId } = request;

    if (month < 1 || month > 12) {
      throw new BadRequestError('Month must be between 1 and 12');
    }

    if (year < 2000 || year > 2100) {
      throw new BadRequestError('Year must be between 2000 and 2100');
    }

    const rows = await this.financeBudgetsRepository.getBudgetVsActual(
      tenantId,
      year,
      month,
      costCenterId,
    );

    const totalBudget = rows.reduce((sum, row) => sum + row.budgetAmount, 0);
    const totalActual = rows.reduce((sum, row) => sum + row.actualAmount, 0);
    const totalVariance = Math.round((totalActual - totalBudget) * 100) / 100;
    const totalVariancePercent =
      totalBudget !== 0
        ? Math.round(((totalActual - totalBudget) / totalBudget) * 10000) / 100
        : 0;

    let overallStatus: 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET';
    if (totalVariancePercent > 10) {
      overallStatus = 'OVER_BUDGET';
    } else if (totalVariancePercent < -10) {
      overallStatus = 'UNDER_BUDGET';
    } else {
      overallStatus = 'ON_BUDGET';
    }

    return {
      rows,
      totals: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        totalVariance,
        totalVariancePercent,
        overallStatus,
      },
    };
  }
}
