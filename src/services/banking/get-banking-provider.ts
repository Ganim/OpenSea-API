/**
 * Shared helper to resolve a BankingProvider for a given bank account.
 * Used by all finance use case factories that need to interact with bank APIs.
 */

import { prisma } from '@/lib/prisma';
import { createBankingProvider } from './banking-provider.factory';
import type { BankingProvider } from './banking-provider.interface';

const certLoader = {
  async loadCertBuffers(certFileId: string, keyFileId: string) {
    // TODO: Replace with Storage service download when S3 integration is ready.
    // For now, reads from filesystem (certFileId/keyFileId are file paths).
    const { readFile } = await import('node:fs/promises');
    const cert = await readFile(certFileId);
    const key = await readFile(keyFileId);
    return { cert, key };
  },
};

export async function getBankingProviderForAccount(
  bankAccountId: string,
): Promise<BankingProvider> {
  const bankAccount = await prisma.bankAccount.findUniqueOrThrow({
    where: { id: bankAccountId },
  });

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
