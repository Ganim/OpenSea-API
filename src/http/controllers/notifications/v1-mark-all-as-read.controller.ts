import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeMarkAllAsReadUseCase } from '@/use-cases/notifications/factories/make-mark-all-as-read-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function markAllAsReadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notifications/mark-all-read',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Mark all user notifications as read',
      response: { 200: z.object({ count: z.number() }) },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeMarkAllAsReadUseCase();
      const { count } = await useCase.execute({ userId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.NOTIFICATIONS.NOTIFICATION_MARK_ALL_READ,
        entityId: userId,
        placeholders: { userName },
        newData: { count },
      });

      return reply.status(200).send({ count });
    },
  });
}
