import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { DeleteCostCenterUseCase } from '../delete-cost-center';

export function makeDeleteCostCenterUseCase() {
  const costCentersRepository = new PrismaCostCentersRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new DeleteCostCenterUseCase(
    costCentersRepository,
    financeEntriesRepository,
  );
}
