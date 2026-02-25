import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailFolder } from '@/entities/email/email-folder';
import type { EmailFolder as PrismaEmailFolder } from '@prisma/generated/client.js';

export function mapEmailFolderPrismaToDomain(folderDb: PrismaEmailFolder) {
  return {
    id: new UniqueEntityID(folderDb.id),
    accountId: new UniqueEntityID(folderDb.accountId),
    remoteName: folderDb.remoteName,
    displayName: folderDb.displayName,
    type: folderDb.type,
    uidValidity: folderDb.uidValidity,
    lastUid: folderDb.lastUid,
    updatedAt: folderDb.updatedAt,
  };
}

export function emailFolderPrismaToDomain(
  folderDb: PrismaEmailFolder,
): EmailFolder {
  return EmailFolder.create(
    mapEmailFolderPrismaToDomain(folderDb),
    new UniqueEntityID(folderDb.id),
  );
}
