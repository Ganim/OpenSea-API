import { env } from '@/@env';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type MimeNode from 'nodemailer/lib/mime-node';

interface SignatureEmailResult {
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

export interface SendSignatureRequestParams {
  to: string;
  signerName: string;
  envelopeTitle: string;
  accessToken: string;
  verificationCode: string;
  expiresAt: Date | null;
}

export interface SendOTPParams {
  to: string;
  signerName: string;
  otpCode: string;
  expiresAt: Date;
}

export interface SendReminderParams {
  to: string;
  signerName: string;
  envelopeTitle: string;
  accessToken: string;
  daysRemaining: number | null;
}

export interface SendCompletionConfirmationParams {
  to: string;
  signerName: string;
  envelopeTitle: string;
  verifyUrl: string;
}

const FROM_ADDRESS = '"OpenSea Assinaturas" <no-reply@opensea.com>';
const BRAND_PRIMARY = '#7c3aed';

function formatExpiryDate(expiresAt: Date | null): string {
  if (!expiresAt) return 'Sem data de expiração definida';
  return expiresAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildSignatureRequestHtml(params: SendSignatureRequestParams): string {
  const signUrl = `${env.FRONTEND_URL}/sign/${params.accessToken}`;
  const expiry = formatExpiryDate(params.expiresAt);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: ${BRAND_PRIMARY}; margin-bottom: 16px;">Você tem um documento para assinar</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Olá, <strong>${params.signerName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Você foi convidado(a) a assinar o documento <strong>"${params.envelopeTitle}"</strong>.
        Para prosseguir com a assinatura, clique no botão abaixo.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${signUrl}"
           style="display: inline-block; background-color: ${BRAND_PRIMARY}; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Acessar documento
        </a>
      </div>

      <div style="background-color: #f3f4f6; border-left: 4px solid ${BRAND_PRIMARY}; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">
          <strong>Código de verificação do documento:</strong>
        </p>
        <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #111827; letter-spacing: 2px;">
          ${params.verificationCode}
        </p>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        <strong>Prazo para assinatura:</strong> ${expiry}
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
        Em conformidade com a Lei nº 14.063/2020 e a LGPD (Lei nº 13.709/2018), seus dados
        pessoais serão tratados exclusivamente para a finalidade de assinatura eletrônica
        deste documento. A assinatura eletrônica registra sua identidade, data, hora e
        endereço IP para fins de integridade e auditoria legal.
      </p>

      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin-top: 12px;">
        Caso o botão não funcione, copie e cole o link abaixo no seu navegador:<br/>
        <a href="${signUrl}" style="color: ${BRAND_PRIMARY}; word-break: break-all;">${signUrl}</a>
      </p>
    </div>
  `;
}

function buildOTPHtml(params: SendOTPParams): string {
  const expiryMinutes = Math.max(
    1,
    Math.round((params.expiresAt.getTime() - Date.now()) / 60000),
  );

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: ${BRAND_PRIMARY}; margin-bottom: 16px;">Seu código de verificação</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Olá, <strong>${params.signerName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Use o código abaixo para confirmar sua identidade e prosseguir com a assinatura
        eletrônica do documento.
      </p>

      <div style="background-color: #eef2ff; border: 2px solid ${BRAND_PRIMARY}; padding: 32px; margin: 32px 0; text-align: center; border-radius: 12px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4338ca; text-transform: uppercase; letter-spacing: 1px;">
          Código de verificação
        </p>
        <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 38px; font-weight: bold; color: ${BRAND_PRIMARY}; letter-spacing: 10px;">
          ${params.otpCode}
        </p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">
          Expira em ${expiryMinutes} minuto(s)
        </p>
      </div>

      <p style="font-size: 14px; color: #b91c1c; font-weight: 600; line-height: 1.6; padding: 12px; background-color: #fef2f2; border-radius: 4px;">
        Não compartilhe este código com ninguém. Nenhum funcionário da OpenSea irá solicitar
        este código por telefone, e-mail ou mensagem.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
        Se você não solicitou este código, ignore este e-mail. Sua conta permanece segura.
      </p>
    </div>
  `;
}

function buildReminderHtml(params: SendReminderParams): string {
  const signUrl = `${env.FRONTEND_URL}/sign/${params.accessToken}`;
  const daysText =
    params.daysRemaining !== null && params.daysRemaining > 0
      ? `Você ainda tem <strong>${params.daysRemaining} dia(s)</strong> para concluir a assinatura.`
      : 'O prazo de assinatura está próximo do vencimento.';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #d97706; margin-bottom: 16px;">Lembrete: você tem um documento pendente</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Olá, <strong>${params.signerName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Este é um lembrete de que o documento <strong>"${params.envelopeTitle}"</strong> ainda
        aguarda sua assinatura.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        ${daysText}
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${signUrl}"
           style="display: inline-block; background-color: ${BRAND_PRIMARY}; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Assinar agora
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
        Caso o botão não funcione, copie e cole o link abaixo no seu navegador:<br/>
        <a href="${signUrl}" style="color: ${BRAND_PRIMARY}; word-break: break-all;">${signUrl}</a>
      </p>
    </div>
  `;
}

function buildCompletionHtml(params: SendCompletionConfirmationParams): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #059669; margin-bottom: 16px;">Documento assinado com sucesso</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Olá, <strong>${params.signerName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        O documento <strong>"${params.envelopeTitle}"</strong> foi assinado com sucesso
        por todas as partes envolvidas.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Você pode verificar a autenticidade do documento e consultar o histórico completo
        da trilha de auditoria através do link abaixo.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.verifyUrl}"
           style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Verificar autenticidade
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
        Este é um e-mail automático de confirmação de assinatura eletrônica. A integridade
        do documento e a identidade dos signatários podem ser verificadas a qualquer momento
        pelo link acima, em conformidade com a Lei nº 14.063/2020.
      </p>
    </div>
  `;
}

export class SignatureEmailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
  });

  async sendSignatureRequest(
    params: SendSignatureRequestParams,
  ): Promise<SignatureEmailResult> {
    return this.deliver({
      to: params.to,
      subject: `Você tem um documento para assinar: ${params.envelopeTitle}`,
      html: buildSignatureRequestHtml(params),
      logLabel: 'signature request',
    });
  }

  async sendOTP(params: SendOTPParams): Promise<SignatureEmailResult> {
    return this.deliver({
      to: params.to,
      subject: 'Seu código de verificação para assinatura',
      html: buildOTPHtml(params),
      logLabel: 'OTP',
    });
  }

  async sendReminder(
    params: SendReminderParams,
  ): Promise<SignatureEmailResult> {
    return this.deliver({
      to: params.to,
      subject: `Lembrete: documento pendente de assinatura — ${params.envelopeTitle}`,
      html: buildReminderHtml(params),
      logLabel: 'reminder',
    });
  }

  async sendCompletionConfirmation(
    params: SendCompletionConfirmationParams,
  ): Promise<SignatureEmailResult> {
    return this.deliver({
      to: params.to,
      subject: `Documento assinado: ${params.envelopeTitle}`,
      html: buildCompletionHtml(params),
      logLabel: 'completion confirmation',
    });
  }

  private async deliver(args: {
    to: string;
    subject: string;
    html: string;
    logLabel: string;
  }): Promise<SignatureEmailResult> {
    // Test environment: simulate success without actual SMTP
    if (env.NODE_ENV === 'test') {
      return {
        success: true,
        message: `Signature ${args.logLabel} email sent successfully (test mode).`,
        return: {
          envelope: { from: FROM_ADDRESS, to: [args.to] },
          messageId: `<test-${Date.now()}@opensea.com>`,
          accepted: [args.to],
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
        from: FROM_ADDRESS,
        to: args.to,
        subject: args.subject,
        html: args.html,
      });

      return {
        success: true,
        message: `Signature ${args.logLabel} email sent successfully.`,
        return: sentInformation,
      };
    } catch (error) {
      if (env.NODE_ENV === 'dev') {
        console.warn(
          `⚠️  SMTP not configured. Signature ${args.logLabel} email would be sent in production:`,
          args.to,
        );
        return {
          success: true,
          message: `Signature ${args.logLabel} email sent successfully (dev mode - no SMTP).`,
          return: {
            envelope: { from: FROM_ADDRESS, to: [args.to] },
            messageId: `<dev-${Date.now()}@opensea.com>`,
            accepted: [args.to],
            rejected: [],
            pending: [],
            response: '250 Message accepted for delivery (dev mode)',
          },
        };
      }

      return {
        success: false,
        message: `Failed to send signature ${args.logLabel} email.`,
        return: error,
      };
    }
  }
}
