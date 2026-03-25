import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type FinanceBudgetDTO,
  financeBudgetToDTO,
} from '@/mappers/finance/finance-budget/finance-budget-to-dto';
import type { FinanceBudgetsRepository } from '@/repositories/finance/finance-budgets-repository';

interface UpdateBudgetUseCaseRequest {
  id: string;
  tenantId: string;
  budgetAmount?: number;
  notes?: string | null;
}

interface UpdateBudgetUseCaseResponse {
  budget: FinanceBudgetDTO;
}

export class UpdateBudgetUseCase {
  constructor(private financeBudgetsRepository: FinanceBudgetsRepository) {}

  async execute(
    request: UpdateBudgetUseCaseRequest,
  ): Promise<UpdateBudgetUseCaseResponse> {
    if (request.budgetAmount !== undefined && request.budgetAmount <= 0) {
      throw new BadRequestError('Budget amount must be positive');
    }

    const budget = await this.financeBudgetsRepository.update({
      id: request.id,
      tenantId: request.tenantId,
      budgetAmount: request.budgetAmount,
      notes: request.notes,
    });

    if (!budget) {
      throw new ResourceNotFoundError('Budget');
    }

    return { budget: financeBudgetToDTO(budget) };
  }
}
