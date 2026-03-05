import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailAccount } from '@/entities/email/email-account';
import type { EmailMessage } from '@/entities/email/email-message';
import { logger } from '@/lib/logger';
import { emailMessageToDTO, type EmailMessageDTO } from '@/mappers/email';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { createImapClient } from '@/services/email/imap-client.service';
import { sanitizeEmailHtml } from '@/services/email/html-sanitizer.service';
// @ts-expect-error - mailparser has no type declarations
import { simpleParser } from 'mailparser';

interface GetEmailMessageRequest {
  tenantId: string;
  userId: string;
  messageId: string;
}

interface GetEmailMessageResponse {
  message: EmailMessageDTO;
}

const SNIPPET_MAX_LENGTH = 200;

function extractSnippet(bodyText: string | null): string | null {
  if (!bodyText) return null;

  const trimmed = bodyText.replace(/\s+/g, ' ').trim();

  if (trimmed.length <= SNIPPET_MAX_LENGTH) {
    return trimmed;
  }

  return trimmed.slice(0, SNIPPET_MAX_LENGTH).trimEnd() + '...';
}

export class GetEmailMessageUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(
    request: GetEmailMessageRequest,
  ): Promise<GetEmailMessageResponse> {
    const { tenantId, userId, messageId } = request;

    const message = await this.emailMessagesRepository.findById(
      messageId,
      tenantId,
    );

    if (!message) {
      throw new ResourceNotFoundError('Email message not found');
    }

    const account = await this.emailAccountsRepository.findById(
      message.accountId.toString(),
      tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        account.id.toString(),
        userId,
      );

      if (!access || !access.canRead) {
        throw new ForbiddenError('You do not have access to this message');
      }
    }

    // Lazy-fetch body from IMAP if not yet stored
    if (message.bodyText === null && message.bodyHtmlSanitized === null) {
      await this.fetchAndStoreBody(message, account);
    }

    let attachments = await this.emailMessagesRepository.listAttachments(
      message.id.toString(),
    );

    // Lazy-fetch attachments if the message has them but records are missing
    // (backwards compat for messages whose body was fetched before attachment support)
    if (message.hasAttachments && attachments.length === 0) {
      await this.fetchAndStoreAttachments(message, account);
      attachments = await this.emailMessagesRepository.listAttachments(
        message.id.toString(),
      );
    }

    return {
      message: emailMessageToDTO(message, attachments),
    };
  }

  private async fetchAndStoreBody(
    message: EmailMessage,
    account: EmailAccount,
  ): Promise<void> {
    try {
      const folder = await this.emailFoldersRepository.findById(
        message.folderId.toString(),
        account.id.toString(),
      );

      if (!folder) {
        logger.warn(
          {
            messageId: message.id.toString(),
            folderId: message.folderId.toString(),
          },
          'Folder not found for lazy body fetch, skipping',
        );
        return;
      }

      const secret = this.credentialCipherService.decrypt(
        account.encryptedSecret,
      );

      const client = createImapClient({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.username,
        secret,
      });

      try {
        await client.connect();

        const lock = await client.getMailboxLock(folder.remoteName);

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawMessage: any = await client.fetchOne(
            String(message.remoteUid),
            { source: true } as Record<string, boolean>,
            { uid: true },
          );

          if (!rawMessage?.source) {
            logger.warn(
              {
                messageId: message.id.toString(),
                remoteUid: message.remoteUid,
              },
              'IMAP returned no source for message, skipping body fetch',
            );
            return;
          }

          const parsed = await simpleParser(rawMessage.source as Buffer);

          const bodyText = parsed.text ?? null;
          const rawHtml = parsed.html || null;
          const bodyHtmlSanitized = rawHtml ? sanitizeEmailHtml(rawHtml) : null;
          const snippet = extractSnippet(bodyText);

          // Update in-memory entity so the returned DTO has the body
          message.bodyText = bodyText;
          message.bodyHtmlSanitized = bodyHtmlSanitized;
          message.snippet = snippet;

          // Persist to database
          await this.emailMessagesRepository.updateBody(
            message.id.toString(),
            bodyText,
            bodyHtmlSanitized,
            snippet,
          );

          // Extract and store attachment METADATA (no file upload — files stay on IMAP)
          await this.extractAndStoreAttachmentMetadata(parsed, message);

          logger.info(
            {
              messageId: message.id.toString(),
              remoteUid: message.remoteUid,
              hasText: bodyText !== null,
              hasHtml: bodyHtmlSanitized !== null,
            },
            'Lazy-fetched and stored email body',
          );
        } finally {
          lock.release();
        }
      } finally {
        await client.logout().catch(() => undefined);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.error(
        {
          err: error,
          messageId: message.id.toString(),
          accountId: account.id.toString(),
        },
        `Failed to lazy-fetch email body: ${reason}`,
      );
      // Do not throw - return message with null body rather than breaking the flow
    }
  }

  /**
   * Extract attachment METADATA from a parsed email and create EmailAttachment
   * records. Files are NOT uploaded to storage — they remain on the IMAP server
   * and are downloaded on-demand when the user clicks download.
   *
   * storageKey stores "imap:{index}" to identify which attachment to fetch later.
   */
  private async extractAndStoreAttachmentMetadata(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed: any,
    message: EmailMessage,
  ): Promise<void> {
    const parsedAttachments = parsed.attachments as
      | Array<{
          filename?: string;
          contentType?: string;
          size?: number;
          content: Buffer;
          contentId?: string;
          related?: boolean;
        }>
      | undefined;

    if (!parsedAttachments || parsedAttachments.length === 0) return;

    // Check idempotency — skip if attachments already exist
    const existing = await this.emailMessagesRepository.listAttachments(
      message.id.toString(),
    );
    if (existing.length > 0) return;

    // Filter out inline CID images (embedded in the HTML body, not downloadable)
    const downloadable = parsedAttachments.filter(
      (att) => !att.related && !att.contentId,
    );

    for (let idx = 0; idx < downloadable.length; idx++) {
      const att = downloadable[idx];
      try {
        await this.emailMessagesRepository.createAttachment({
          messageId: message.id.toString(),
          filename: att.filename || 'sem-nome',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size ?? att.content.length,
          storageKey: `imap:${idx}`,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          { messageId: message.id.toString(), filename: att.filename },
          `Failed to store attachment metadata: ${reason}`,
        );
      }
    }
  }

  /**
   * Backwards-compatible lazy-fetch: for messages whose body was already fetched
   * (by older code without attachment support), connect to IMAP, download source,
   * parse, and store attachment metadata.
   */
  private async fetchAndStoreAttachments(
    message: EmailMessage,
    account: EmailAccount,
  ): Promise<void> {
    try {
      const folder = await this.emailFoldersRepository.findById(
        message.folderId.toString(),
        account.id.toString(),
      );

      if (!folder) return;

      const secret = this.credentialCipherService.decrypt(
        account.encryptedSecret,
      );

      const client = createImapClient({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.username,
        secret,
      });

      try {
        await client.connect();
        const lock = await client.getMailboxLock(folder.remoteName);

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawMessage: any = await client.fetchOne(
            String(message.remoteUid),
            { source: true } as Record<string, boolean>,
            { uid: true },
          );

          if (!rawMessage?.source) return;

          const parsed = await simpleParser(rawMessage.source as Buffer);
          await this.extractAndStoreAttachmentMetadata(parsed, message);
        } finally {
          lock.release();
        }
      } finally {
        await client.logout().catch(() => undefined);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.error(
        {
          err: error,
          messageId: message.id.toString(),
          accountId: account.id.toString(),
        },
        `Failed to lazy-fetch email attachments: ${reason}`,
      );
      // Do not throw — return without attachments rather than breaking the flow
    }
  }
}
