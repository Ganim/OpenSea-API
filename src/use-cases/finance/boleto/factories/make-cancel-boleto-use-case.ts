import { prisma } from '@/lib/prisma';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { createBankingProvider } from '@/services/banking/banking-provider.factory';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';
import { CancelBoletoUseCase } from '../cancel-boleto';

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

export function makeCancelBoletoUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new CancelBoletoUseCase(financeEntriesRepository, getBankingProvider);
}
