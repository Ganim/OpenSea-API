import {
  type FinanceBudgetDTO,
  financeBudgetToDTO,
} from '@/mappers/finance/finance-budget/finance-budget-to-dto';
import type { FinanceBudgetsRepository } from '@/repositories/finance/finance-budgets-repository';

interface ListBudgetsUseCaseRequest {
  tenantId: string;
  year?: number;
  categoryId?: string;
  costCenterId?: string;
  page?: number;
  limit?: number;
}

interface ListBudgetsUseCaseResponse {
  budgets: FinanceBudgetDTO[];
  total: number;
}

export class ListBudgetsUseCase {
  constructor(private financeBudgetsRepository: FinanceBudgetsRepository) {}

  async execute(
    request: ListBudgetsUseCaseRequest,
  ): Promise<ListBudgetsUseCaseResponse> {
    const { budgets, total } = await this.financeBudgetsRepository.findMany({
      tenantId: request.tenantId,
      year: request.year,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      page: request.page,
      limit: request.limit,
    });

    return {
      budgets: budgets.map(financeBudgetToDTO),
      total,
    };
  }
}
