import { PrismaFinanceBudgetsRepository } from '@/repositories/finance/prisma/prisma-finance-budgets-repository';
import { CreateBudgetUseCase } from '../create-budget';

export function makeCreateBudgetUseCase() {
  const financeBudgetsRepository = new PrismaFinanceBudgetsRepository();
  return new CreateBudgetUseCase(financeBudgetsRepository);
}
