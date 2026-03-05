import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { DownloadEmailAttachmentUseCase } from '../download-email-attachment';

export function makeDownloadEmailAttachmentUseCase() {
  return new DownloadEmailAttachmentUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailMessagesRepository(),
    new PrismaEmailFoldersRepository(),
    new CredentialCipherService(),
  );
}

/**
 * @deprecated — Use makeDownloadEmailAttachmentUseCase instead.
 * Kept for backwards compatibility with existing import sites.
 */
export const makeGetEmailAttachmentDownloadUrlUseCase =
  makeDownloadEmailAttachmentUseCase;
