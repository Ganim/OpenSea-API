import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeSendEmailNotificationUseCase } from '@/use-cases/notifications/factories/make-send-email-notification-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function sendNotificationEmailController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notifications/:id/send',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.NOTIFICATIONS.SEND,
        resource: 'notifications',
      }),
    ],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Trigger email sending for a notification',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          success: z.boolean(),
          notification: z.object({ id: z.string() }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const useCase = makeSendEmailNotificationUseCase();
      const result = await useCase.execute({ notificationId: id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.NOTIFICATIONS.NOTIFICATION_SEND_EMAIL,
        entityId: id,
        placeholders: { recipientEmail: result.notification.id || 'N/A' },
        newData: { success: result.success },
      });

      return reply.status(200).send({
        success: result.success,
        notification: { id: result.notification.id },
      });
    },
  });
}
