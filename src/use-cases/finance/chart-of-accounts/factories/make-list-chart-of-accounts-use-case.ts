import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { ListChartOfAccountsUseCase } from '../list-chart-of-accounts';

export function makeListChartOfAccountsUseCase() {
  const repository = new PrismaChartOfAccountsRepository();
  return new ListChartOfAccountsUseCase(repository);
}
