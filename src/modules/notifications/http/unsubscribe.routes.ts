/**
 * Public unsubscribe endpoint — receives the HMAC-signed token from
 * email footers, verifies it, disables every EMAIL preference for the
 * (user, category) pair and renders a minimal HTML confirmation page.
 *
 * Intentionally public (no auth) because email clients follow links
 * without passing headers.
 */

import type { FastifyInstance } from 'fastify';

import { prisma } from '@/lib/prisma';

import { verifyUnsubscribeToken } from '../application/unsubscribe-token.js';

export async function notificationsUnsubscribeRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/v1/notifications/unsubscribe/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    const parsed = verifyUnsubscribeToken(token);

    if (!parsed) {
      reply.code(400).type('text/html; charset=utf-8');
      return renderPage({
        title: 'Link inválido',
        message:
          'O link de desinscrição é inválido ou expirou. Atualize suas preferências no perfil.',
      });
    }

    try {
      const category = await prisma.notificationCategory.findUnique({
        where: { id: parsed.categoryId },
        select: { code: true, name: true, mandatory: true },
      });
      if (!category) {
        reply.code(404).type('text/html; charset=utf-8');
        return renderPage({
          title: 'Categoria não encontrada',
          message: 'A categoria de notificação referenciada não existe mais.',
        });
      }
      if (category.mandatory) {
        reply.code(409).type('text/html; charset=utf-8');
        return renderPage({
          title: 'Não é possível desinscrever',
          message: `"${category.name}" é uma categoria obrigatória (segurança/compliance) e não pode ser desativada.`,
        });
      }

      // Find ALL tenant scopes for this user — disable email across all
      const users = await prisma.tenantUser.findMany({
        where: { userId: parsed.userId, deletedAt: null },
        select: { tenantId: true },
      });

      for (const tu of users) {
        await prisma.notificationPreferenceV2.upsert({
          where: {
            userId_tenantId_categoryId_channel: {
              userId: parsed.userId,
              tenantId: tu.tenantId,
              categoryId: parsed.categoryId,
              channel: 'EMAIL',
            },
          },
          update: { isEnabled: false },
          create: {
            userId: parsed.userId,
            tenantId: tu.tenantId,
            categoryId: parsed.categoryId,
            channel: 'EMAIL',
            isEnabled: false,
          },
        });
      }

      reply.code(200).type('text/html; charset=utf-8');
      return renderPage({
        title: 'Desinscrito com sucesso',
        message: `Você não receberá mais e-mails da categoria "${category.name}". Você pode reativar a qualquer momento nas preferências do seu perfil.`,
      });
    } catch (err) {
      reply.code(500).type('text/html; charset=utf-8');
      return renderPage({
        title: 'Erro ao processar',
        message:
          'Ocorreu um erro ao processar seu pedido. Tente novamente pelas preferências do perfil.',
      });
    }
  });
}

function renderPage(opts: { title: string; message: string }): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>${escape(opts.title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a">
<div style="max-width:520px;margin:80px auto;background:#fff;padding:32px;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.04)">
<h1 style="margin:0 0 12px;font-size:20px">${escape(opts.title)}</h1>
<p style="margin:0;line-height:1.6;color:#334155">${escape(opts.message)}</p>
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
