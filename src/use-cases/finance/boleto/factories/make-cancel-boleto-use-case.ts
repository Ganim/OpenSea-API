import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { CancelBoletoUseCase } from '../cancel-boleto';

export function makeCancelBoletoUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new CancelBoletoUseCase(
    financeEntriesRepository,
    getBankingProviderForAccount,
  );
}
