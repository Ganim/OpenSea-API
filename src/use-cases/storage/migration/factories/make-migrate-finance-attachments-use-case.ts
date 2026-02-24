import { prisma } from '@/lib/prisma';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import {
  MigrateFinanceAttachmentsUseCase,
  type FinanceAttachmentReader,
  type FinanceAttachmentRecord,
} from '../migrate-finance-attachments';

/**
 * Reads FinanceAttachment records directly from Prisma.
 * This is only used in production for the one-time migration.
 */
class PrismaFinanceAttachmentReader implements FinanceAttachmentReader {
  async findAllByTenant(tenantId: string): Promise<FinanceAttachmentRecord[]> {
    const attachments = await prisma.financeAttachment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return attachments.map((attachment) => ({
      id: attachment.id,
      tenantId: attachment.tenantId,
      entryId: attachment.entryId,
      type: attachment.type,
      fileName: attachment.fileName,
      fileKey: attachment.fileKey,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      uploadedBy: attachment.uploadedBy,
      createdAt: attachment.createdAt,
    }));
  }
}

export function makeMigrateFinanceAttachmentsUseCase() {
  const storageFilesRepository = new PrismaStorageFilesRepository();
  const storageFileVersionsRepository =
    new PrismaStorageFileVersionsRepository();
  const storageFoldersRepository = new PrismaStorageFoldersRepository();
  const financeAttachmentReader = new PrismaFinanceAttachmentReader();

  return new MigrateFinanceAttachmentsUseCase(
    storageFilesRepository,
    storageFileVersionsRepository,
    storageFoldersRepository,
    financeAttachmentReader,
  );
}
