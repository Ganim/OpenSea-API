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
import { queueAuditLog } from '@/workers/queues/audit.queue';
// @ts-expect-error - mailparser has no type declarations
import { simpleParser } from 'mailparser';

interface DownloadEmailAttachmentRequest {
  tenantId: string;
  userId: string;
  messageId: string;
  attachmentId: string;
}

interface DownloadEmailAttachmentResponse {
  content: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

export class DownloadEmailAttachmentUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(
    request: DownloadEmailAttachmentRequest,
  ): Promise<DownloadEmailAttachmentResponse> {
    const { tenantId, userId, messageId, attachmentId } = request;

    // 1. Find message
    const message = await this.emailMessagesRepository.findById(
      messageId,
      tenantId,
    );

    if (!message) {
      throw new ResourceNotFoundError('Email message not found');
    }

    // 2. Find account + check permission
    const account = await this.emailAccountsRepository.findById(
      message.accountId.toString(),
      tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === userId;
    let canRead = isOwner;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        account.id.toString(),
        userId,
      );
      canRead = access?.canRead === true;
    }

    if (!canRead) {
      throw new ForbiddenError('You do not have access to this email account');
    }

    // 3. Find attachment record
    const attachment =
      await this.emailMessagesRepository.findAttachmentById(attachmentId);

    if (!attachment || attachment.messageId.toString() !== messageId) {
      throw new ResourceNotFoundError('Attachment not found');
    }

    // 4. Parse the storageKey to get IMAP attachment index
    const imapIndex = this.parseImapIndex(attachment.storageKey);

    if (imapIndex === null) {
      throw new ResourceNotFoundError(
        'Attachment data is not available (invalid storage reference)',
      );
    }

    // 5. Find folder for IMAP mailbox
    const folder = await this.emailFoldersRepository.findById(
      message.folderId.toString(),
      account.id.toString(),
    );

    if (!folder) {
      throw new ResourceNotFoundError(
        'Email folder not found — cannot fetch attachment from IMAP',
      );
    }

    // 6. Connect to IMAP and download the attachment
    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const accountIdStr = account.id.toString();
    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountIdStr, {
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
    });

    try {
      const lock = await client.getMailboxLock(folder.remoteName);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawMessage: any = await client.fetchOne(
          String(message.remoteUid),
          { source: true } as Record<string, boolean>,
          { uid: true },
        );

        if (!rawMessage?.source) {
          throw new ResourceNotFoundError(
            'IMAP returned no source for message — cannot download attachment',
          );
        }

        const parsed = await simpleParser(rawMessage.source as Buffer);

        // Filter out inline CID images (same logic as extractAndStoreAttachmentMetadata)
        const downloadable = (
          parsed.attachments as Array<{
            filename?: string;
            contentType?: string;
            size?: number;
            content: Buffer;
            contentId?: string;
            related?: boolean;
          }>
        ).filter((att) => !att.related && !att.contentId);

        if (imapIndex >= downloadable.length) {
          throw new ResourceNotFoundError(
            `Attachment at index ${imapIndex} not found in message (found ${downloadable.length} attachments)`,
          );
        }

        const att = downloadable[imapIndex];

        logger.info(
          {
            messageId: message.id.toString(),
            attachmentId,
            filename: att.filename,
            size: att.content.length,
          },
          'Downloaded attachment from IMAP on-demand',
        );

        queueAuditLog({
          userId,
          action: 'EMAIL_ATTACHMENT_DOWNLOAD',
          entity: 'EMAIL_ATTACHMENT',
          entityId: attachmentId,
          module: 'EMAIL',
          description: `Downloaded attachment "${att.filename || attachment.filename}" from message ${messageId}`,
          metadata: {
            messageId,
            filename: att.filename || attachment.filename,
            contentType: att.contentType || attachment.contentType,
            size: att.content.length,
          },
        }).catch(() => {});

        return {
          content: att.content,
          filename: att.filename || attachment.filename,
          contentType: att.contentType || attachment.contentType,
          size: att.content.length,
        };
      } finally {
        lock.release();
      }
    } catch (err) {
      pool.destroy(accountIdStr);
      throw err;
    } finally {
      pool.release(accountIdStr);
    }
  }

  /**
   * Parse storageKey format "imap:{index}" into the numeric index.
   * Returns null if the format is unrecognized.
   */
  private parseImapIndex(storageKey: string): number | null {
    const match = storageKey.match(/^imap:(\d+)$/);
    if (!match) return null;
    return parseInt(match[1], 10);
  }
}
