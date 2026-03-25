import { PrismaFinanceBudgetsRepository } from '@/repositories/finance/prisma/prisma-finance-budgets-repository';
import { ListBudgetsUseCase } from '../list-budgets';

export function makeListBudgetsUseCase() {
  const financeBudgetsRepository = new PrismaFinanceBudgetsRepository();
  return new ListBudgetsUseCase(financeBudgetsRepository);
}
