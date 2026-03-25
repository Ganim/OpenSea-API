import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { FinanceBudgetsRepository } from '@/repositories/finance/finance-budgets-repository';

interface DeleteBudgetUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteBudgetUseCase {
  constructor(private financeBudgetsRepository: FinanceBudgetsRepository) {}

  async execute(request: DeleteBudgetUseCaseRequest): Promise<void> {
    const budget = await this.financeBudgetsRepository.findById(
      request.id,
      request.tenantId,
    );

    if (!budget) {
      throw new ResourceNotFoundError('Budget');
    }

    await this.financeBudgetsRepository.delete(request.id, request.tenantId);
  }
}
