import { PrismaFinanceBudgetsRepository } from '@/repositories/finance/prisma/prisma-finance-budgets-repository';
import { UpdateBudgetUseCase } from '../update-budget';

export function makeUpdateBudgetUseCase() {
  const financeBudgetsRepository = new PrismaFinanceBudgetsRepository();
  return new UpdateBudgetUseCase(financeBudgetsRepository);
}
