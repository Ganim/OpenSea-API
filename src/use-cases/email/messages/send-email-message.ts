import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import type {
  SmtpAttachmentInput,
  SmtpClientService,
} from '@/services/email/smtp-client.service';
import { ImapFlow } from 'imapflow';

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

      const client = new ImapFlow({
        host: params.host,
        port: params.port,
        secure: params.secure,
        auth: {
          user: params.username,
          pass: params.secret,
        },
        logger: false,
      });

      const rawMessage = this.buildRawMessage({
        from: params.from,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.html,
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

  private buildRawMessage(params: {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
  }): string {
    const headers = [
      `From: ${params.from}`,
      `To: ${params.to.join(', ')}`,
      ...(params.cc?.length ? [`Cc: ${params.cc.join(', ')}`] : []),
      `Subject: ${params.subject}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
    ];

    return `${headers.join('\r\n')}\r\n\r\n${params.html}`;
  }
}
