import { prisma } from '@/lib/prisma';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { createBankingProvider } from '@/services/banking/banking-provider.factory';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';
import { ApprovePaymentOrderUseCase } from '../approve-payment-order';

async function getBankingProviderForAccount(
  bankAccountId: string,
  _tenantId: string,
): Promise<BankingProvider> {
  const bankAccount = await prisma.bankAccount.findUniqueOrThrow({
    where: { id: bankAccountId },
  });

  const certLoader = {
    async loadCertBuffers(certFileId: string, keyFileId: string) {
      // Load certificate files from storage
      // This will be properly implemented when storage integration is complete
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

export function makeApprovePaymentOrderUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new ApprovePaymentOrderUseCase(
    paymentOrdersRepository,
    financeEntriesRepository,
    getBankingProviderForAccount,
  );
}
