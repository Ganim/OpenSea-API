import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { CreateChartOfAccountUseCase } from '../create-chart-of-account';

export function makeCreateChartOfAccountUseCase() {
  const repository = new PrismaChartOfAccountsRepository();
  return new CreateChartOfAccountUseCase(repository);
}
