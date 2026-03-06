import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { emailAccountToDTO, type EmailAccountDTO } from '@/mappers/email';
import type { EmailAccountsRepository } from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import type { ImapClientService } from '@/services/email/imap-client.service';
import type { SmtpClientService } from '@/services/email/smtp-client.service';
import { isEmailHostSafe } from '@/utils/security/validate-email-host';

interface CreateEmailAccountRequest {
  tenantId: string;
  userId: string;
  address: string;
  displayName?: string | null;
  imapHost: string;
  imapPort: number;
  imapSecure?: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  username: string;
  secret: string;
  isDefault?: boolean;
  signature?: string | null;
  visibility?: 'PRIVATE' | 'SHARED';
}

interface CreateEmailAccountResponse {
  account: EmailAccountDTO;
}

export class CreateEmailAccountUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private credentialCipherService: CredentialCipherService,
    private imapClientService: ImapClientService,
    private smtpClientService: SmtpClientService,
  ) {}

  async execute(
    request: CreateEmailAccountRequest,
  ): Promise<CreateEmailAccountResponse> {
    const existing = await this.emailAccountsRepository.findByAddress(
      request.address,
      request.tenantId,
    );

    if (existing) {
      throw new BadRequestError('Email account already exists for this tenant');
    }

    // SSRF protection: resolve DNS and block private/reserved IPs
    const [imapSafe, smtpSafe] = await Promise.all([
      isEmailHostSafe(request.imapHost),
      isEmailHostSafe(request.smtpHost),
    ]);
    if (!imapSafe) {
      throw new BadRequestError(
        'Host IMAP bloqueado: endereços internos ou não-resolvíveis não são permitidos',
      );
    }
    if (!smtpSafe) {
      throw new BadRequestError(
        'Host SMTP bloqueado: endereços internos ou não-resolvíveis não são permitidos',
      );
    }

    try {
      await this.imapClientService.testConnection({
        host: request.imapHost,
        port: request.imapPort,
        secure: request.imapSecure ?? true,
        username: request.username,
        secret: request.secret,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new BadRequestError(
        `Falha ao conectar ao servidor IMAP (${request.imapHost}:${request.imapPort}): ${detail}`,
      );
    }

    try {
      await this.smtpClientService.testConnection({
        host: request.smtpHost,
        port: request.smtpPort,
        secure: request.smtpSecure ?? true,
        username: request.username,
        secret: request.secret,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new BadRequestError(
        `Falha ao conectar ao servidor SMTP (${request.smtpHost}:${request.smtpPort}): ${detail}`,
      );
    }

    if (request.isDefault) {
      await this.emailAccountsRepository.unsetDefaultAccounts(
        request.tenantId,
        request.userId,
      );
    }

    const encryptedSecret = this.credentialCipherService.encrypt(
      request.secret,
    );

    const account = await this.emailAccountsRepository.create({
      tenantId: request.tenantId,
      ownerUserId: request.userId,
      address: request.address,
      displayName: request.displayName ?? null,
      imapHost: request.imapHost,
      imapPort: request.imapPort,
      imapSecure: request.imapSecure ?? true,
      smtpHost: request.smtpHost,
      smtpPort: request.smtpPort,
      smtpSecure: request.smtpSecure ?? true,
      username: request.username,
      encryptedSecret,
      isDefault: request.isDefault ?? false,
      signature: request.signature ?? null,
      visibility: request.visibility ?? 'PRIVATE',
      isActive: true,
    });

    return { account: emailAccountToDTO(account) };
  }
}
