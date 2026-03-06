import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailAccountsRepository } from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import type { ImapClientService } from '@/services/email/imap-client.service';
import type { SmtpClientService } from '@/services/email/smtp-client.service';

interface TestEmailConnectionRequest {
  tenantId: string;
  userId: string;
  accountId: string;
}

export class TestEmailConnectionUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private credentialCipherService: CredentialCipherService,
    private imapClientService: ImapClientService,
    private smtpClientService: SmtpClientService,
  ) {}

  async execute(request: TestEmailConnectionRequest): Promise<void> {
    const account = await this.emailAccountsRepository.findById(
      request.accountId,
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === request.userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        request.accountId,
        request.userId,
      );

      if (!access || !access.canManage) {
        throw new ForbiddenError('You do not have access to test this account');
      }
    }

    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    try {
      await this.imapClientService.testConnection({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.username,
        secret,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new BadRequestError(
        `Falha ao conectar ao servidor IMAP (${account.imapHost}:${account.imapPort}): ${detail}`,
      );
    }

    try {
      await this.smtpClientService.testConnection({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        username: account.username,
        secret,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new BadRequestError(
        `Falha ao conectar ao servidor SMTP (${account.smtpHost}:${account.smtpPort}): ${detail}`,
      );
    }
  }
}
