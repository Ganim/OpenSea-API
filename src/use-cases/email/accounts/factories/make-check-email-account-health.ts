import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { SmtpClientService } from '@/services/email/smtp-client.service';
import { CheckEmailAccountHealthUseCase } from '../check-email-account-health';

export function makeCheckEmailAccountHealthUseCase() {
  return new CheckEmailAccountHealthUseCase(
    new PrismaEmailAccountsRepository(),
    new CredentialCipherService(),
    new SmtpClientService(),
  );
}
