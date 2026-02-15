import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeMarkAsReadUseCase } from '@/use-cases/notifications/factories/make-mark-as-read-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function markAsReadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/notifications/:id/read',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Mark a notification as read',
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.null() },
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

      const useCase = makeMarkAsReadUseCase();
      await useCase.execute({ notificationId: id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.NOTIFICATIONS.NOTIFICATION_MARK_READ,
        entityId: id,
        placeholders: { userName },
      });

      return reply.status(204).send(null);
    },
  });
}
