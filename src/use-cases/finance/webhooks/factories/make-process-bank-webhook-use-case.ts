import { prisma } from '@/lib/prisma';
import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaBankWebhookEventsRepository } from '@/repositories/finance/prisma/prisma-bank-webhook-events-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { createBankingProvider } from '@/services/banking/banking-provider.factory';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';
import { ProcessBankWebhookUseCase } from '../process-bank-webhook';

class ProcessBankWebhookUseCaseWithThreshold extends ProcessBankWebhookUseCase {
  protected override async resolveAutoLowThreshold(
    bankAccountId: string,
  ): Promise<number | null> {
    const record = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      select: { autoLowThreshold: true },
    });

    if (!record || record.autoLowThreshold === null) return null;
    return Number(record.autoLowThreshold);
  }
}

async function getBankingProvider(
  bankAccountId: string,
  _providerName: string,
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

export function makeProcessBankWebhookUseCase() {
  const webhookEventsRepository = new PrismaBankWebhookEventsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new ProcessBankWebhookUseCaseWithThreshold(
    webhookEventsRepository,
    financeEntriesRepository,
    bankAccountsRepository,
    getBankingProvider,
  );
}
