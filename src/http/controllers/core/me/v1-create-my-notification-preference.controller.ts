import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createNotificationPreferenceSchema,
  notificationPreferenceResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-create-notification-preference-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createMyNotificationPreferenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/me/notification-preferences',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'Create my notification preference',
      description:
        'Cria uma nova preferencia de notificacao para o usuario autenticado.',
      security: [{ bearerAuth: [] }],
      body: createNotificationPreferenceSchema,
      response: {
        201: z.object({ preference: notificationPreferenceResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateNotificationPreferenceUseCase();
        const { preference } = await useCase.execute({
          ...data,
          userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.NOTIFICATION_PREFERENCE_CREATE,
          entityId: preference.id,
          placeholders: { userName },
          newData: data,
        });

        return reply.status(201).send({ preference });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
