import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { ImapClientService } from '@/services/email/imap-client.service';
import { SmtpClientService } from '@/services/email/smtp-client.service';
import { UpdateEmailAccountUseCase } from '../update-email-account';

export function makeUpdateEmailAccountUseCase() {
  return new UpdateEmailAccountUseCase(
    new PrismaEmailAccountsRepository(),
    new CredentialCipherService(),
    new ImapClientService(),
    new SmtpClientService(),
  );
}
