import {
  markDeprecated,
  NOTIFICATION_PREFS_V1_SUNSET,
} from '@/http/helpers/deprecation.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { notificationPreferenceResponseSchema } from '@/http/schemas/sales.schema';
import { makeListNotificationPreferencesByUserUseCase } from '@/use-cases/sales/notification-preferences/factories/make-list-notification-preferences-by-user-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * @deprecated Use GET /v1/notifications/preferences (v2) instead.
 * The v1 endpoint only covers AlertType-based preferences (stock alerts).
 * v2 provides category-based preferences across all modules.
 * Sunset: 2026-07-17.
 */
export async function listMyNotificationPreferencesController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/notification-preferences',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my notification preferences (DEPRECATED)',
      description:
        'DEPRECATED — use GET /v1/notifications/preferences (v2) instead. Sunset: 2026-07-17. Lista as preferencias de notificacao v1 (AlertType) do usuario autenticado.',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        enabledOnly: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          preferences: z.array(notificationPreferenceResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { enabledOnly } = request.query;

      const useCase = makeListNotificationPreferencesByUserUseCase();
      const { preferences } = await useCase.execute({ userId, enabledOnly });

      markDeprecated(reply, {
        sunsetDate: NOTIFICATION_PREFS_V1_SUNSET,
        replacement: '/v1/notifications/preferences',
        notes: 'v2 category-based preferences',
      });
      return reply.status(200).send({ preferences });
    },
  });
}
