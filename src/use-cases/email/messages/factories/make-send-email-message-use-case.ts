import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { SmtpClientService } from '@/services/email/smtp-client.service';
import { SendEmailMessageUseCase } from '../send-email-message';

export function makeSendEmailMessageUseCase() {
  return new SendEmailMessageUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailFoldersRepository(),
    new CredentialCipherService(),
    new SmtpClientService(),
  );
}
