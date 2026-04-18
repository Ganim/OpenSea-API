/**
 * EMAIL adapter — sends notification content via the existing
 * EmailService (Nodemailer). Phase 5 will add React Email templates
 * and optional Resend provider. For now we wrap the existing service
 * and generate a minimal branded HTML.
 */

import { EmailService } from '@/services/email-service.js';
import { prisma } from '@/lib/prisma.js';

import type { Notification } from '../../../../../prisma/generated/prisma/client.js';
import { buildUnsubscribeUrl } from '../../application/unsubscribe-token.js';

import type {
  ChannelAdapter,
  ChannelDeliveryResult,
} from './channel-adapter.js';

export class EmailChannelAdapter implements ChannelAdapter {
  readonly channel = 'EMAIL';
  private readonly emailService = new EmailService();

  async send(notification: Notification): Promise<ChannelDeliveryResult> {
    const start = Date.now();
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, username: true },
      });
      if (!user?.email) {
        return { status: 'SKIPPED', error: 'user has no email' };
      }

      const unsubscribeUrl = notification.categoryId
        ? buildUnsubscribeUrl(notification.userId, notification.categoryId)
        : null;

      const html = renderNotificationEmail({
        title: notification.title,
        body: notification.message,
        actionUrl: notification.actionUrl ?? undefined,
        actionText: notification.actionText ?? undefined,
        unsubscribeUrl: unsubscribeUrl ?? undefined,
        recipientName: user.username ?? undefined,
      });

      await this.emailService.sendNotificationEmail(
        user.email,
        notification.title,
        html,
      );

      return {
        status: 'SENT',
        providerName: 'smtp',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'FAILED',
        providerName: 'smtp',
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - start,
      };
    }
  }
}

function renderNotificationEmail(opts: {
  title: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
  unsubscribeUrl?: string;
  recipientName?: string;
}): string {
  const { title, body, actionUrl, actionText, unsubscribeUrl, recipientName } =
    opts;
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>${escape(title)}</title></head>
<body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="width:32px;height:32px;background:#0ea5e9;border-radius:8px"></div>
        <strong style="font-size:14px;color:#475569">OpenSea</strong>
      </div>
      ${recipientName ? `<p style="color:#64748b;margin:0 0 8px">Olá, ${escape(recipientName)}</p>` : ''}
      <h1 style="font-size:20px;margin:0 0 12px;color:#0f172a">${escape(title)}</h1>
      <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 20px">${escape(body)}</p>
      ${
        actionUrl
          ? `<a href="${escape(actionUrl)}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">${escape(actionText ?? 'Abrir')}</a>`
          : ''
      }
    </div>
    <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px">
      Você está recebendo este e-mail porque está cadastrado no OpenSea.
      ${unsubscribeUrl ? `<br/><a href="${escape(unsubscribeUrl)}" style="color:#94a3b8">Desinscrever-se deste tipo de notificação</a>` : ''}
    </p>
  </div>
</body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
