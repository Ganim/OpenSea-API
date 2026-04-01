/**
 * Shared helper to resolve a BankingProvider for a given bank account.
 * Used by all finance use case factories that need to interact with bank APIs.
 */

import { prisma } from '@/lib/prisma';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { createBankingProvider } from './banking-provider.factory';
import type { BankingProvider } from './banking-provider.interface';

const certLoader = {
  async loadCertBuffers(certFileId: string, keyFileId: string) {
    // Try S3 first (production): look up StorageFile records by ID to get S3 keys,
    // then download the files. Falls back to filesystem for local development.
    try {
      const [certFile, keyFile] = await Promise.all([
        prisma.storageFile.findUnique({ where: { id: certFileId } }),
        prisma.storageFile.findUnique({ where: { id: keyFileId } }),
      ]);

      if (certFile?.fileKey && keyFile?.fileKey) {
        const s3 = S3FileUploadService.getInstance();
        const [cert, key] = await Promise.all([
          s3.getObject(certFile.fileKey),
          s3.getObject(keyFile.fileKey),
        ]);
        return { cert, key };
      }
    } catch {
      // S3 not configured or StorageFile not found — fall through to filesystem
    }

    // Fallback: read from filesystem (certFileId/keyFileId treated as file paths)
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
