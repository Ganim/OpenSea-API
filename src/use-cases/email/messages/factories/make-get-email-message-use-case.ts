import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { GetEmailMessageUseCase } from '../get-email-message';

export function makeGetEmailMessageUseCase() {
  return new GetEmailMessageUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailMessagesRepository(),
    new PrismaEmailFoldersRepository(),
    new CredentialCipherService(),
  );
}
