import nodemailer, { type SendMailOptions } from 'nodemailer';

export interface SmtpConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  secret: string;
}

export interface SmtpAttachmentInput {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendEmailPayload {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: SmtpAttachmentInput[];
  inReplyTo?: string;
  references?: string[];
}

export class SmtpClientService {
  async testConnection(config: SmtpConnectionConfig): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const transporter = this.createTransporter(config);
    await transporter.verify();
  }

  async send(
    config: SmtpConnectionConfig,
    payload: SendEmailPayload,
  ): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
      return 'test-message-id';
    }

    const transporter = this.createTransporter(config);

    const sendOptions: SendMailOptions = {
      from: payload.from,
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      ...(payload.inReplyTo ? { inReplyTo: payload.inReplyTo } : {}),
      ...(payload.references?.length
        ? { references: payload.references.join(' ') }
        : {}),
    };

    const result = await transporter.sendMail(sendOptions);
    return result.messageId;
  }

  private createTransporter(config: SmtpConnectionConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.secret,
      },
    });
  }
}
