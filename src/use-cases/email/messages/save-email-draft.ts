import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
    EmailAccountsRepository,
    EmailFoldersRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { ImapFlow } from 'imapflow';
import { randomUUID } from 'node:crypto';

interface SaveEmailDraftRequest {
  tenantId: string;
  userId: string;
  accountId: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyHtml?: string;
}

interface SaveEmailDraftResponse {
  draftId: string;
}

export class SaveEmailDraftUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(
    request: SaveEmailDraftRequest,
  ): Promise<SaveEmailDraftResponse> {
    const account = await this.emailAccountsRepository.findById(
      request.accountId,
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    if (!account.isActive) {
      throw new BadRequestError('Email account is not active');
    }

    const isOwner = account.ownerUserId.toString() === request.userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        account.id.toString(),
        request.userId,
      );

      if (!access || !access.canSend) {
        throw new ForbiddenError('You do not have access to save drafts');
      }
    }

    const folders = await this.emailFoldersRepository.listByAccount(
      account.id.toString(),
    );
    const draftsFolder = folders.find((folder) => folder.type === 'DRAFTS');

    if (!draftsFolder) {
      throw new BadRequestError('Drafts folder not found for this account');
    }

    const secret = this.credentialCipherService.decrypt(account.encryptedSecret);
    const draftId = `<${randomUUID()}@opensea.local>`;

    const from = account.displayName
      ? `${account.displayName} <${account.address}>`
      : account.address;

    const rawMessage = this.buildRawMessage({
      from,
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      subject: request.subject ?? '',
      html: request.bodyHtml ?? '',
      messageId: draftId,
    });

    // In test environment, skip IMAP connection (no real server available)
    if (process.env.NODE_ENV === 'test') {
      return { draftId };
    }

    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      auth: {
        user: account.username,
        pass: secret,
      },
      logger: false,
    });

    try {
      await client.connect();
      await client.append(draftsFolder.remoteName, rawMessage, {
        flags: ['\\Draft'],
        internalDate: new Date(),
      });

      return { draftId };
    } catch {
      throw new BadRequestError('Failed to save draft on provider');
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  private buildRawMessage(params: {
    from: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    html: string;
    messageId: string;
  }): string {
    const headers = [
      `From: ${params.from}`,
      ...(params.to?.length ? [`To: ${params.to.join(', ')}`] : []),
      ...(params.cc?.length ? [`Cc: ${params.cc.join(', ')}`] : []),
      ...(params.bcc?.length ? [`Bcc: ${params.bcc.join(', ')}`] : []),
      `Subject: ${params.subject}`,
      `Message-ID: ${params.messageId}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
    ];

    return `${headers.join('\r\n')}\r\n\r\n${params.html}`;
  }
}
