import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { DeleteChartOfAccountUseCase } from '../delete-chart-of-account';

export function makeDeleteChartOfAccountUseCase() {
  const repository = new PrismaChartOfAccountsRepository();
  return new DeleteChartOfAccountUseCase(repository);
}
