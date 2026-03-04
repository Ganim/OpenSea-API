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
import { ImapFlow } from 'imapflow';
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

function sanitizeHtml(html: string): string {
  let sanitized = html;

  // Remove <script> tags and their content
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );

  // Remove on* event handler attributes
  sanitized = sanitized.replace(
    /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    '',
  );

  return sanitized;
}

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

    const attachments = await this.emailMessagesRepository.listAttachments(
      message.id.toString(),
    );

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
          const bodyHtmlSanitized = rawHtml ? sanitizeHtml(rawHtml) : null;
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
}
