import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { EmitBoletoUseCase } from '../emit-boleto';

export function makeEmitBoletoUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new EmitBoletoUseCase(
    financeEntriesRepository,
    bankAccountsRepository,
    getBankingProviderForAccount,
  );
}
