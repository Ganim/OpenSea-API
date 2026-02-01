import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeProcessScheduledNotificationsUseCase } from '@/use-cases/notifications/factories/make-process-scheduled-notifications-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function processScheduledNotificationsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notifications/process-scheduled',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.NOTIFICATIONS.MANAGE,
        resource: 'notifications',
      }),
    ],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Process pending scheduled notifications manually',
      description:
        'Processa manualmente as notificacoes agendadas pendentes. Retorna a quantidade processada, enviada e eventuais erros encontrados.',
      response: {
        200: z.object({
          processed: z.number(),
          sent: z.number(),
          errors: z.array(z.object({ id: z.string(), error: z.string() })),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const useCase = makeProcessScheduledNotificationsUseCase();
      const result = await useCase.execute();

      await logAudit(request, {
        message: AUDIT_MESSAGES.NOTIFICATIONS.NOTIFICATION_PROCESS_SCHEDULED,
        entityId: 'system',
        placeholders: { count: String(result.processed) },
        newData: {
          processed: result.processed,
          sent: result.sent.length,
          errors: result.errors.length,
        },
      });

      return reply.status(200).send({
        processed: result.processed,
        sent: result.sent.length,
        errors: result.errors,
      });
    },
  });
}
