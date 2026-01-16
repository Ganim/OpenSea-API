import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  notificationPreferenceResponseSchema,
  updateNotificationPreferenceSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-get-notification-preference-use-case';
import { makeUpdateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-update-notification-preference-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateMyNotificationPreferenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/me/notification-preferences/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'Update my notification preference',
      params: z.object({ id: z.string().uuid() }),
      body: updateNotificationPreferenceSchema,
      response: {
        200: z.object({ preference: notificationPreferenceResponseSchema }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;
      const data = request.body;

      try {
        // Verificar se a preferência pertence ao usuário
        const getPreferenceUseCase = makeGetNotificationPreferenceUseCase();
        const { preference: existingPreference } =
          await getPreferenceUseCase.execute({ id });

        if (existingPreference.userId !== userId) {
          throw new UnauthorizedError(
            'You can only update your own notification preferences.',
          );
        }

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
        if (err instanceof UnauthorizedError) {
          return reply.status(401).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
