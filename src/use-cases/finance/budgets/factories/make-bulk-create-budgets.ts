import { PrismaFinanceBudgetsRepository } from '@/repositories/finance/prisma/prisma-finance-budgets-repository';
import { BulkCreateBudgetsUseCase } from '../bulk-create-budgets';

export function makeBulkCreateBudgetsUseCase() {
  const financeBudgetsRepository = new PrismaFinanceBudgetsRepository();
  return new BulkCreateBudgetsUseCase(financeBudgetsRepository);
}
