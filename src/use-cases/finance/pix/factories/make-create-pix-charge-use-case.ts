import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { CreatePixChargeUseCase } from '../create-pix-charge';

export function makeCreatePixChargeUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new CreatePixChargeUseCase(
    financeEntriesRepository,
    bankAccountsRepository,
    getBankingProviderForAccount,
  );
}
