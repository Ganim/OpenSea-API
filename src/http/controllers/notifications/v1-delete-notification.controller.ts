import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteNotificationUseCase } from '@/use-cases/notifications/factories/make-delete-notification-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteNotificationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/notifications/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Delete a notification (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.void() },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeDeleteNotificationUseCase();
      await useCase.execute({ notificationId: id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.NOTIFICATIONS.NOTIFICATION_DELETE,
        entityId: id,
        placeholders: { userName },
      });

      return reply.status(204).send();
    },
  });
}
