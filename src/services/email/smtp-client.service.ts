import { logger } from '@/lib/logger';
import { convert as htmlToText } from 'html-to-text';
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

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
    try {
      await transporter.verify();
    } finally {
      transporter.close();
    }
  }

  async send(
    config: SmtpConnectionConfig,
    payload: SendEmailPayload,
  ): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
      return 'test-message-id';
    }

    logger.info(
      { host: config.host, port: config.port, secure: config.secure, to: payload.to, subject: payload.subject },
      '[SMTP] Sending email',
    );

    const transporter = this.createTransporter(config);

    // Auto-generate plain text from HTML if not provided.
    // Multipart emails (text + HTML) are much less likely to be flagged as spam
    // by Gmail, Hotmail, and other external providers.
    const text = payload.text || this.htmlToPlainText(payload.html);

    const sendOptions: SendMailOptions = {
      from: payload.from,
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.html,
      text,
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

      const rejected = result.rejected ?? [];
      const accepted = result.accepted ?? [];

      logger.info(
        {
          messageId: result.messageId,
          accepted,
          rejected,
          response: result.response,
          envelope: result.envelope,
        },
        '[SMTP] Email sent successfully',
      );

      if (rejected.length > 0) {
        logger.warn(
          { rejected, accepted, messageId: result.messageId, response: result.response },
          '[SMTP] Some recipients were REJECTED by server',
        );
      }

      return result.messageId;
    } catch (error) {
      logger.error(
        { err: error, host: config.host, port: config.port, to: payload.to },
        '[SMTP] Failed to send email',
      );
      throw error;
    } finally {
      transporter.close();
    }
  }

  private createTransporter(config: SmtpConnectionConfig) {
    // Extract domain from username (e.g. "guilherme@casaesmeralda.ind.br" → "casaesmeralda.ind.br")
    // Used as EHLO hostname.  On cloud VMs (Fly.io, AWS, etc.) os.hostname()
    // returns something like "287e356f033048" which is NOT a valid FQDN.
    // Many SMTP servers (especially cPanel/HostGator shared hosting) verify
    // the EHLO hostname and may allow local delivery but BLOCK external relay
    // for non-FQDN EHLO names.
    const domain = config.username.includes('@')
      ? config.username.split('@')[1]
      : config.host;

    const smtpDebug = process.env.SMTP_DEBUG === 'true';

    const opts: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      name: domain,
      auth: {
        user: config.username,
        pass: config.secret,
      },
      tls: {
        // cPanel/HostGator shared hosting uses certificates issued for the
        // server hostname (e.g. server123.hostgator.com.br), NOT the custom
        // domain (mail.casaesmeralda.ind.br).  Without this flag, nodemailer
        // rejects the connection with UNABLE_TO_VERIFY_LEAF_SIGNATURE or
        // ERR_TLS_CERT_ALTNAME_INVALID.
        rejectUnauthorized: false,
      },
      // Log full SMTP conversation when SMTP_DEBUG=true
      debug: smtpDebug,
      logger: smtpDebug as boolean | undefined,
      // Prevent zombie connections on unreliable mail servers
      connectionTimeout: 30_000,  // 30s to establish TCP connection
      greetingTimeout: 30_000,    // 30s for server greeting
      socketTimeout: 120_000,     // 2min inactivity before closing
    };

    return nodemailer.createTransport(opts) as Transporter<SMTPTransport.SentMessageInfo>;
  }

  private htmlToPlainText(html: string): string {
    try {
      return htmlToText(html, {
        wordwrap: 80,
        selectors: [
          { selector: 'img', format: 'skip' },
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        ],
      });
    } catch {
      // Fallback: strip tags manually
      return html.replace(/<[^>]+>/g, '').trim();
    }
  }
}
