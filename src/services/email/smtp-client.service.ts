import { logger } from '@/lib/logger';
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

    logger.debug(
      { host: config.host, port: config.port, secure: config.secure, to: payload.to, subject: payload.subject },
      '[SMTP] Sending email',
    );

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

    try {
      const result = await transporter.sendMail(sendOptions);
      logger.info(
        { messageId: result.messageId, accepted: result.accepted, rejected: result.rejected },
        '[SMTP] Email sent successfully',
      );
      return result.messageId;
    } catch (error) {
      logger.error(
        { err: error, host: config.host, port: config.port, to: payload.to },
        '[SMTP] Failed to send email',
      );
      throw error;
    }
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
      // Prevent zombie connections on unreliable mail servers
      connectionTimeout: 30_000,  // 30s to establish TCP connection
      greetingTimeout: 30_000,    // 30s for server greeting
      socketTimeout: 120_000,     // 2min inactivity before closing
    });
  }
}
