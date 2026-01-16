import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  notificationPreferenceResponseSchema,
  updateNotificationPreferenceSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-update-notification-preference-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateNotificationPreferenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/notification-preferences/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Notification Preferences'],
      summary: 'Update a notification preference',
      params: z.object({ id: z.string().uuid() }),
      body: updateNotificationPreferenceSchema,
      response: {
        200: z.object({ preference: notificationPreferenceResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateNotificationPreferenceUseCase();
        const { preference } = await useCase.execute({
          id,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.NOTIFICATION_PREFERENCE_UPDATE,
          entityId: id,
          placeholders: { userName },
          newData: data,
        });

        return reply.status(200).send({ preference });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
