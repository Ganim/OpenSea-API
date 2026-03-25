import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type FinanceBudgetDTO,
  financeBudgetToDTO,
} from '@/mappers/finance/finance-budget/finance-budget-to-dto';
import type { FinanceBudgetsRepository } from '@/repositories/finance/finance-budgets-repository';

interface CreateBudgetUseCaseRequest {
  tenantId: string;
  categoryId: string;
  costCenterId?: string;
  year: number;
  month: number;
  budgetAmount: number;
  notes?: string;
}

interface CreateBudgetUseCaseResponse {
  budget: FinanceBudgetDTO;
}

export class CreateBudgetUseCase {
  constructor(private financeBudgetsRepository: FinanceBudgetsRepository) {}

  async execute(
    request: CreateBudgetUseCaseRequest,
  ): Promise<CreateBudgetUseCaseResponse> {
    const { budgetAmount, month, year } = request;

    if (budgetAmount <= 0) {
      throw new BadRequestError('Budget amount must be positive');
    }

    if (month < 1 || month > 12) {
      throw new BadRequestError('Month must be between 1 and 12');
    }

    if (year < 2000 || year > 2100) {
      throw new BadRequestError('Year must be between 2000 and 2100');
    }

    const budget = await this.financeBudgetsRepository.upsert({
      tenantId: request.tenantId,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      year,
      month,
      budgetAmount,
      notes: request.notes,
    });

    return { budget: financeBudgetToDTO(budget) };
  }
}
