import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { ImapClientService } from '@/services/email/imap-client.service';
import { SmtpClientService } from '@/services/email/smtp-client.service';
import { CreateEmailAccountUseCase } from '../create-email-account';

export function makeCreateEmailAccountUseCase() {
  return new CreateEmailAccountUseCase(
    new PrismaEmailAccountsRepository(),
    new CredentialCipherService(),
    new ImapClientService(),
    new SmtpClientService(),
  );
}
