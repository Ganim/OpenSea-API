import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
    EmailAccountsRepository,
    EmailFoldersRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { createImapClient } from '@/services/email/imap-client.service';
import type {
    SmtpAttachmentInput,
    SmtpClientService,
} from '@/services/email/smtp-client.service';
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

    const html = account.signature
      ? `${request.bodyHtml}<br /><br />${account.signature}`
      : request.bodyHtml;

    const messageId = await this.smtpClientService.send(
      {
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        username: account.username,
        secret,
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

    await this.appendToSentFolder({
      accountId: account.id.toString(),
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      from,
      to: request.to,
      cc: request.cc,
      subject: request.subject,
      html,
      messageId,
      inReplyTo: request.inReplyTo,
      references: request.references,
      attachments: request.attachments,
    });

    return { messageId };
  }

  private async appendToSentFolder(params: {
    accountId: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    secret: string;
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
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      const folders = await this.emailFoldersRepository.listByAccount(
        params.accountId,
      );
      const sentFolder = folders.find((folder) => folder.type === 'SENT');

      if (!sentFolder) return;

      const client = createImapClient({
        host: params.host,
        port: params.port,
        secure: params.secure,
        username: params.username,
        secret: params.secret,
      });

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

      try {
        await client.connect();
        await client.append(
          sentFolder.remoteName,
          rawMessage,
          ['\\Seen'],
          new Date(),
        );
      } finally {
        await client.logout().catch(() => undefined);
      }
    } catch {
      // ignore append errors to avoid failing SMTP send
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
