import { env } from '@/@env';
import { Email } from '@/entities/core/value-objects/email';
import { Token } from '@/entities/core/value-objects/token';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type MimeNode from 'nodemailer/lib/mime-node';

interface EmailServiceResponse {
  success: boolean;
  message?: string;
  return?:
    | {
        envelope: MimeNode.Envelope;
        messageId: string;
        accepted: Array<string | Mail.Address>;
        rejected: Array<string | Mail.Address>;
        pending: Array<string | Mail.Address>;
        response: string;
      }
    | unknown;
}

export class EmailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465, // SMTPS on 465, STARTTLS on 587/25
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
  });

  async sendPasswordResetEmail(
    email: Email,
    token: Token,
  ): Promise<EmailServiceResponse> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token.toString()}`;

    // In test environment, simulate email sending without actual SMTP
    if (env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Password reset email sent successfully (test mode).',
        return: {
          envelope: { from: 'no-reply@simpleauth.com', to: [email.toString()] },
          messageId: `<test-${Date.now()}@simpleauth.com>`,
          accepted: [email.toString()],
          rejected: [],
          pending: [],
          response: '250 Message accepted for delivery (test mode)',
        },
      };
    }

    try {
      // Only verify connection in production
      if (env.NODE_ENV === 'production') {
        await this.transporter.verify();
      }

      const sentInformation = await this.transporter.sendMail({
        from: '"SimpleAuth" <no-reply@simpleauth.com>',
        to: email.toString(),
        subject: 'Recuperação de senha',
        html: `
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique <a href="${resetUrl}">aqui</a> para redefinir sua senha.</p>
        <p>Se não foi você, ignore este e-mail.</p>
      `,
      });

      return {
        success: true,
        message: 'Password reset email sent successfully.',
        return: sentInformation,
      };
    } catch (error) {
      // In development, log error but don't fail (allow testing without SMTP)
      if (env.NODE_ENV === 'dev') {
        console.warn(
          '⚠️  SMTP not configured. Email would be sent in production:',
          email.toString(),
        );
        return {
          success: true,
          message:
            'Password reset email sent successfully (dev mode - no SMTP).',
          return: {
            envelope: {
              from: 'no-reply@simpleauth.com',
              to: [email.toString()],
            },
            messageId: `<dev-${Date.now()}@simpleauth.com>`,
            accepted: [email.toString()],
            rejected: [],
            pending: [],
            response: '250 Message accepted for delivery (dev mode)',
          },
        };
      }

      // In production, fail on email errors
      return {
        success: false,
        message: 'Failed to send password reset email.',
        return: error,
      };
    }
  }

  async sendNotificationEmail(
    toEmail: string,
    title: string,
    message: string,
  ): Promise<EmailServiceResponse> {
    // Ambiente de teste: simula envio
    if (env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Notification email sent successfully (test mode).',
        return: {
          envelope: { from: 'no-reply@system.com', to: [toEmail] },
          messageId: `<test-${Date.now()}@system.com>`,
          accepted: [toEmail],
          rejected: [],
          pending: [],
          response: '250 Message accepted for delivery (test mode)',
        },
      };
    }

    try {
      // Only verify in production and send email
      if (env.NODE_ENV === 'production') {
        await this.transporter.verify();
      }

      const sentInformation = await this.transporter.sendMail({
        from: '"System" <no-reply@system.com>',
        to: toEmail,
        subject: title,
        html: `<p>${message}</p>`,
      });

      return {
        success: true,
        message: 'Notification email sent successfully.',
        return: sentInformation,
      };
    } catch (error) {
      if (env.NODE_ENV === 'dev') {
        console.warn(
          '⚠️  SMTP not configured. Notification email would be sent in production:',
          toEmail,
        );
        return {
          success: true,
          message: 'Notification email sent successfully (dev mode - no SMTP).',
          return: {
            envelope: { from: 'no-reply@system.com', to: [toEmail] },
            messageId: `<dev-${Date.now()}@system.com>`,
            accepted: [toEmail],
            rejected: [],
            pending: [],
            response: '250 Message accepted for delivery (dev mode)',
          },
        };
      }

      return {
        success: false,
        message: 'Failed to send notification email.',
        return: error,
      };
    }
  }

  async sendMagicLinkEmail(
    toEmail: string,
    token: string,
    expiresInMinutes: number,
  ): Promise<EmailServiceResponse> {
    const magicLinkUrl = `${env.FRONTEND_URL}/auth/magic-link?token=${token}`;

    // In test environment, simulate email sending without actual SMTP
    if (env.NODE_ENV === 'test') {
      return {
        success: true,
        message: 'Magic link email sent successfully (test mode).',
        return: {
          envelope: { from: 'no-reply@opensea.com', to: [toEmail] },
          messageId: `<test-${Date.now()}@opensea.com>`,
          accepted: [toEmail],
          rejected: [],
          pending: [],
          response: '250 Message accepted for delivery (test mode)',
        },
      };
    }

    try {
      if (env.NODE_ENV === 'production') {
        await this.transporter.verify();
      }

      const sentInformation = await this.transporter.sendMail({
        from: '"OpenSea" <no-reply@opensea.com>',
        to: toEmail,
        subject: 'Seu link de acesso',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 16px;">Acesso ao sistema</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Clique no botão abaixo para acessar sua conta. Este link é válido por ${expiresInMinutes} minutos.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLinkUrl}"
                 style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Acessar minha conta
              </a>
            </div>
            <p style="color: #888; font-size: 14px; line-height: 1.5;">
              Se você não solicitou este link, ignore este e-mail.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px;">
              Caso o botão não funcione, copie e cole o link abaixo no seu navegador:<br/>
              <a href="${magicLinkUrl}" style="color: #7c3aed; word-break: break-all;">${magicLinkUrl}</a>
            </p>
          </div>
        `,
      });

      return {
        success: true,
        message: 'Magic link email sent successfully.',
        return: sentInformation,
      };
    } catch (error) {
      if (env.NODE_ENV === 'dev') {
        console.warn(
          '⚠️  SMTP not configured. Magic link email would be sent in production:',
          toEmail,
        );
        return {
          success: true,
          message: 'Magic link email sent successfully (dev mode - no SMTP).',
          return: {
            envelope: { from: 'no-reply@opensea.com', to: [toEmail] },
            messageId: `<dev-${Date.now()}@opensea.com>`,
            accepted: [toEmail],
            rejected: [],
            pending: [],
            response: '250 Message accepted for delivery (dev mode)',
          },
        };
      }

      return {
        success: false,
        message: 'Failed to send magic link email.',
        return: error,
      };
    }
  }
}
