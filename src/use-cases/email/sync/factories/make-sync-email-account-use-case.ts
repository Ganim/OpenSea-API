import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { EmailSyncNotificationServiceImpl } from '../email-sync-notification.service';
import { SyncEmailAccountUseCase } from '../sync-email-account';

export function makeSyncEmailAccountUseCase() {
  const emailAccountsRepository = new PrismaEmailAccountsRepository();

  return new SyncEmailAccountUseCase(
    emailAccountsRepository,
    new PrismaEmailFoldersRepository(),
    new PrismaEmailMessagesRepository(),
    new CredentialCipherService(),
    new EmailSyncNotificationServiceImpl(emailAccountsRepository),
  );
}
