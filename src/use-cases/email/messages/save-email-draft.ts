import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { logger } from '@/lib/logger';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { getImapConnectionPool } from '@/services/email/imap-connection-pool';
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
    private emailMessagesRepository: EmailMessagesRepository,
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

    const draftId = `<${randomUUID()}@opensea.local>`;

    // Save draft to DB first (source of truth)
    await this.emailMessagesRepository.create({
      tenantId: request.tenantId,
      accountId: account.id.toString(),
      folderId: draftsFolder.id.toString(),
      remoteUid: -(
        (Date.now() % 2_000_000_000) +
        Math.floor(Math.random() * 1000)
      ),
      messageId: draftId,
      fromAddress: account.address,
      fromName: account.displayName ?? null,
      toAddresses: request.to ?? [],
      ccAddresses: request.cc ?? [],
      bccAddresses: request.bcc ?? [],
      subject: request.subject ?? '',
      bodyHtmlSanitized: request.bodyHtml ?? null,
      receivedAt: new Date(),
    });

    // Sync draft to IMAP (fire-and-forget — DB is already saved)
    this.syncDraftToImap(account, draftsFolder, request, draftId).catch(
      (error) => {
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          {
            err: error,
            draftId,
            accountId: account.id.toString(),
          },
          `Failed to sync draft to IMAP (DB saved): ${reason}`,
        );
      },
    );

    return { draftId };
  }

  private async syncDraftToImap(
    account: {
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
      address: string;
      displayName: string | null;
      id: { toString(): string };
    },
    draftsFolder: { remoteName: string },
    request: SaveEmailDraftRequest,
    draftId: string,
  ): Promise<void> {
    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

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

    const accountId = account.id.toString();
    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountId, {
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
    });

    try {
      await client.append(
        draftsFolder.remoteName,
        rawMessage,
        ['\\Draft'],
        new Date(),
      );
    } catch (err) {
      pool.destroy(accountId);
      throw err;
    } finally {
      pool.release(accountId);
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
