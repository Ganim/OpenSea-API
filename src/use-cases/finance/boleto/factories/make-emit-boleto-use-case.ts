import { prisma } from '@/lib/prisma';
import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { createBankingProvider } from '@/services/banking/banking-provider.factory';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';
import { EmitBoletoUseCase } from '../emit-boleto';

async function getBankingProvider(
  bankAccountId: string,
): Promise<BankingProvider> {
  const bankAccount = await prisma.bankAccount.findUniqueOrThrow({
    where: { id: bankAccountId },
  });

  const certLoader = {
    async loadCertBuffers(certFileId: string, keyFileId: string) {
      const { readFile } = await import('node:fs/promises');
      const cert = await readFile(certFileId);
      const key = await readFile(keyFileId);
      return { cert, key };
    },
  };

  return createBankingProvider(
    {
      apiProvider: bankAccount.apiProvider,
      apiClientId: bankAccount.apiClientId,
      apiScopes: bankAccount.apiScopes,
      bankCode: bankAccount.bankCode,
      agency: bankAccount.agency,
      accountNumber: bankAccount.accountNumber,
    },
    certLoader,
    bankAccount.apiCertFileId,
    bankAccount.apiCertKeyFileId,
  );
}

export function makeEmitBoletoUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new EmitBoletoUseCase(
    financeEntriesRepository,
    bankAccountsRepository,
    getBankingProvider,
  );
}
