import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { SyncEmailFolderUseCase } from '../sync-email-folder';

export function makeSyncEmailFolderUseCase() {
  return new SyncEmailFolderUseCase(
    new PrismaEmailFoldersRepository(),
    new PrismaEmailMessagesRepository(),
    new CredentialCipherService(),
  );
}
