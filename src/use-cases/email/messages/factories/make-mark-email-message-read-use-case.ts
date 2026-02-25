import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { MarkEmailMessageReadUseCase } from '../mark-email-message-read';

export function makeMarkEmailMessageReadUseCase() {
  return new MarkEmailMessageReadUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailFoldersRepository(),
    new PrismaEmailMessagesRepository(),
    new CredentialCipherService(),
  );
}
