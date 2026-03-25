import { PrismaFinanceBudgetsRepository } from '@/repositories/finance/prisma/prisma-finance-budgets-repository';
import { GetBudgetVsActualUseCase } from '../get-budget-vs-actual';

export function makeGetBudgetVsActualUseCase() {
  const financeBudgetsRepository = new PrismaFinanceBudgetsRepository();
  return new GetBudgetVsActualUseCase(financeBudgetsRepository);
}
