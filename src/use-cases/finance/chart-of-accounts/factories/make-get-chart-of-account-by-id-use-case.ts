import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { GetChartOfAccountByIdUseCase } from '../get-chart-of-account-by-id';

export function makeGetChartOfAccountByIdUseCase() {
  const repository = new PrismaChartOfAccountsRepository();
  return new GetChartOfAccountByIdUseCase(repository);
}
