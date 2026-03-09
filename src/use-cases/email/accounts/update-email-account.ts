import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { emailAccountToDTO, type EmailAccountDTO } from '@/mappers/email';
import type { EmailAccountsRepository } from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import type { ImapClientService } from '@/services/email/imap-client.service';
import type { SmtpClientService } from '@/services/email/smtp-client.service';
import { isEmailHostSafe } from '@/utils/security/validate-email-host';

interface UpdateEmailAccountRequest {
  tenantId: string;
  userId: string;
  accountId: string;
  displayName?: string | null;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  tlsVerify?: boolean;
  username?: string;
  secret?: string;
  visibility?: 'PRIVATE' | 'SHARED';
  isActive?: boolean;
  isDefault?: boolean;
  signature?: string | null;
}

interface UpdateEmailAccountResponse {
  account: EmailAccountDTO;
}

export class UpdateEmailAccountUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private credentialCipherService: CredentialCipherService,
    private imapClientService: ImapClientService,
    private smtpClientService: SmtpClientService,
  ) {}

  async execute(
    request: UpdateEmailAccountRequest,
  ): Promise<UpdateEmailAccountResponse> {
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
        throw new ForbiddenError(
          'You do not have access to update this account',
        );
      }
    }

    if (request.isDefault && !isOwner) {
      throw new ForbiddenError('Only the owner can set default accounts');
    }

    const needsConnectionTest =
      request.imapHost !== undefined ||
      request.imapPort !== undefined ||
      request.imapSecure !== undefined ||
      request.smtpHost !== undefined ||
      request.smtpPort !== undefined ||
      request.smtpSecure !== undefined ||
      request.tlsVerify !== undefined ||
      request.username !== undefined ||
      request.secret !== undefined;

    let secretToUse = request.secret;

    if (needsConnectionTest) {
      // SSRF protection: resolve DNS and block private/reserved IPs
      const imapHost = request.imapHost ?? account.imapHost;
      const smtpHost = request.smtpHost ?? account.smtpHost;
      const [imapSafe, smtpSafe] = await Promise.all([
        isEmailHostSafe(imapHost),
        isEmailHostSafe(smtpHost),
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

      if (!secretToUse) {
        secretToUse = this.credentialCipherService.decrypt(
          account.encryptedSecret,
        );
      }

      const effectiveImapHost = request.imapHost ?? account.imapHost;
      const effectiveImapPort = request.imapPort ?? account.imapPort;
      const effectiveSmtpHost = request.smtpHost ?? account.smtpHost;
      const effectiveSmtpPort = request.smtpPort ?? account.smtpPort;

      try {
        await this.imapClientService.testConnection({
          host: effectiveImapHost,
          port: effectiveImapPort,
          secure: request.imapSecure ?? account.imapSecure,
          username: request.username ?? account.username,
          secret: secretToUse,
          rejectUnauthorized: request.tlsVerify ?? account.tlsVerify,
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new BadRequestError(
          `Falha ao conectar ao servidor IMAP (${effectiveImapHost}:${effectiveImapPort}): ${detail}`,
        );
      }

      try {
        await this.smtpClientService.testConnection({
          host: effectiveSmtpHost,
          port: effectiveSmtpPort,
          secure: request.smtpSecure ?? account.smtpSecure,
          username: request.username ?? account.username,
          secret: secretToUse,
          rejectUnauthorized: request.tlsVerify ?? account.tlsVerify,
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new BadRequestError(
          `Falha ao conectar ao servidor SMTP (${effectiveSmtpHost}:${effectiveSmtpPort}): ${detail}`,
        );
      }
    }

    if (request.isDefault) {
      await this.emailAccountsRepository.unsetDefaultAccounts(
        request.tenantId,
        account.ownerUserId.toString(),
      );
    }

    const encryptedSecret = request.secret
      ? this.credentialCipherService.encrypt(request.secret)
      : undefined;

    const updated = await this.emailAccountsRepository.update({
      id: request.accountId,
      tenantId: request.tenantId,
      displayName: request.displayName,
      imapHost: request.imapHost,
      imapPort: request.imapPort,
      imapSecure: request.imapSecure,
      smtpHost: request.smtpHost,
      smtpPort: request.smtpPort,
      smtpSecure: request.smtpSecure,
      tlsVerify: request.tlsVerify,
      username: request.username,
      encryptedSecret,
      visibility: request.visibility,
      isActive: request.isActive,
      isDefault: request.isDefault,
      signature: request.signature,
    });

    if (!updated) {
      throw new BadRequestError('Email account update failed');
    }

    return { account: emailAccountToDTO(updated) };
  }
}
