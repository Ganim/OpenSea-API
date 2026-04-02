import { prisma } from '@/lib/prisma';
import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaBankWebhookEventsRepository } from '@/repositories/finance/prisma/prisma-bank-webhook-events-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
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

export function makeProcessBankWebhookUseCase() {
  const webhookEventsRepository = new PrismaBankWebhookEventsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new ProcessBankWebhookUseCaseWithThreshold(
    webhookEventsRepository,
    financeEntriesRepository,
    bankAccountsRepository,
    (bankAccountId, _providerName) =>
      getBankingProviderForAccount(bankAccountId),
  );
}
