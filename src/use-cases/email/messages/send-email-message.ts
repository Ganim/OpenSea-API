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
import type {
  SmtpAttachmentInput,
  SmtpClientService,
} from '@/services/email/smtp-client.service';
import { queueAuditLog } from '@/workers/queues/audit.queue';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

interface SendEmailMessageRequest {
  tenantId: string;
  userId: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: SmtpAttachmentInput[];
  inReplyTo?: string;
  references?: string[];
}

interface SendEmailMessageResponse {
  messageId: string;
}

export class SendEmailMessageUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private credentialCipherService: CredentialCipherService,
    private smtpClientService: SmtpClientService,
  ) {}

  async execute(
    request: SendEmailMessageRequest,
  ): Promise<SendEmailMessageResponse> {
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
        throw new ForbiddenError('You do not have access to send emails');
      }
    }

    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const from = account.displayName
      ? `${account.displayName} <${account.address}>`
      : account.address;

    // NOTE: signature is already included by the frontend compose dialog.
    // Do NOT append it again here to avoid duplication.
    const html = request.bodyHtml;

    const messageId = await this.smtpClientService.send(
      {
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        username: account.username,
        secret,
        rejectUnauthorized: account.tlsVerify,
      },
      {
        from,
        to: request.to,
        cc: request.cc,
        bcc: request.bcc,
        subject: request.subject,
        html,
        attachments: request.attachments,
        inReplyTo: request.inReplyTo,
        references: request.references,
      },
    );

    // Fire-and-forget: append to IMAP Sent folder and mark original as answered.
    // These are non-critical and should NOT block the HTTP response — SMTP
    // delivery already succeeded at this point.
    this.appendToSentFolder({
      accountId: account.id.toString(),
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
      from,
      to: request.to,
      cc: request.cc,
      subject: request.subject,
      html,
      messageId,
      inReplyTo: request.inReplyTo,
      references: request.references,
      attachments: request.attachments,
    }).catch((err) => {
      logger.warn(
        { err, accountId: account.id.toString(), messageId },
        '[SendEmail] Failed to append message to Sent folder (non-critical)',
      );
    });

    if (request.inReplyTo) {
      this.markOriginalAsAnswered(
        account.id.toString(),
        request.tenantId,
        request.inReplyTo,
      ).catch((err) => {
        logger.warn(
          {
            err,
            accountId: account.id.toString(),
            inReplyTo: request.inReplyTo,
          },
          '[SendEmail] Failed to mark original as answered (non-critical)',
        );
      });
    }

    queueAuditLog({
      userId: request.userId,
      action: 'EMAIL_SEND',
      entity: 'EMAIL_MESSAGE',
      entityId: messageId,
      module: 'EMAIL',
      description: `Sent email from ${from} to ${request.to.join(', ')}`,
      metadata: {
        accountId: account.id.toString(),
        from,
        to: request.to,
        subject: request.subject,
        hasAttachments: (request.attachments?.length ?? 0) > 0,
      },
    }).catch(() => {});

    return { messageId };
  }

  private async appendToSentFolder(params: {
    accountId: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    secret: string;
    rejectUnauthorized?: boolean;
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
    messageId?: string;
    inReplyTo?: string;
    references?: string[];
    attachments?: SmtpAttachmentInput[];
  }): Promise<void> {
    try {
      const folders = await this.emailFoldersRepository.listByAccount(
        params.accountId,
      );
      const sentFolder = folders.find((folder) => folder.type === 'SENT');

      if (!sentFolder) return;

      const rawMessage = await this.buildRawMessage({
        from: params.from,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.html,
        messageId: params.messageId,
        inReplyTo: params.inReplyTo,
        references: params.references,
        attachments: params.attachments,
      });

      const pool = getImapConnectionPool();
      const client = await pool.acquire(params.accountId, {
        host: params.host,
        port: params.port,
        secure: params.secure,
        username: params.username,
        secret: params.secret,
        rejectUnauthorized: params.rejectUnauthorized,
      });

      try {
        await client.append(
          sentFolder.remoteName,
          rawMessage,
          ['\\Seen'],
          new Date(),
        );
      } catch (err) {
        pool.destroy(params.accountId);
        throw err;
      } finally {
        pool.release(params.accountId);
      }
    } catch (err) {
      logger.warn(
        { err, accountId: params.accountId },
        '[SendEmail] appendToSentFolder inner error',
      );
    }
  }

  private async markOriginalAsAnswered(
    accountId: string,
    tenantId: string,
    inReplyTo: string,
  ): Promise<void> {
    try {
      const original = await this.emailMessagesRepository.findByRfcMessageId(
        accountId,
        inReplyTo,
      );

      if (original && !original.isAnswered) {
        await this.emailMessagesRepository.update({
          id: original.id.toString(),
          tenantId,
          isAnswered: true,
        });
      }
    } catch (err) {
      logger.warn(
        { err, accountId, inReplyTo },
        '[SendEmail] markOriginalAsAnswered inner error',
      );
    }
  }

  private async buildRawMessage(params: {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
    messageId?: string;
    inReplyTo?: string;
    references?: string[];
    attachments?: SmtpAttachmentInput[];
  }): Promise<Buffer> {
    const mail = new MailComposer({
      from: params.from,
      to: params.to.join(', '),
      ...(params.cc?.length ? { cc: params.cc.join(', ') } : {}),
      subject: params.subject,
      html: params.html,
      ...(params.messageId ? { messageId: params.messageId } : {}),
      ...(params.inReplyTo ? { inReplyTo: params.inReplyTo } : {}),
      ...(params.references?.length
        ? { references: params.references.join(' ') }
        : {}),
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return mail.compile().build();
  }
}
