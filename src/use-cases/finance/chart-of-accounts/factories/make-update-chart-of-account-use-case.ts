import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { UpdateChartOfAccountUseCase } from '../update-chart-of-account';

export function makeUpdateChartOfAccountUseCase() {
  const repository = new PrismaChartOfAccountsRepository();
  return new UpdateChartOfAccountUseCase(repository);
}
