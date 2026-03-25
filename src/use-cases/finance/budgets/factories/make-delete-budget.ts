import { PrismaFinanceBudgetsRepository } from '@/repositories/finance/prisma/prisma-finance-budgets-repository';
import { DeleteBudgetUseCase } from '../delete-budget';

export function makeDeleteBudgetUseCase() {
  const financeBudgetsRepository = new PrismaFinanceBudgetsRepository();
  return new DeleteBudgetUseCase(financeBudgetsRepository);
}
