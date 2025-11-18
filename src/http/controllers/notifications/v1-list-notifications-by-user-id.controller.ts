import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { NotificationPresenter } from '@/http/presenters/notifications/notification-presenter';
import {
  listNotificationsQuerySchema,
  notificationResponseSchema,
} from '@/http/schemas';
import { makeListNotificationsByUserIdUseCase } from '@/use-cases/notifications/factories/make-list-notifications-by-user-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listNotificationsByUserIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/notifications',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications'],
      summary: 'List notifications by userId (authenticated user)',
      querystring: listNotificationsQuerySchema,
      response: {
        200: z.object({
          notifications: z.array(notificationResponseSchema),
          total: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        isRead,
        type,
        channel,
        priority,
        startDate,
        endDate,
        page,
        limit,
      } = request.query;

      const listNotificationsByUserIdUseCase = makeListNotificationsByUserIdUseCase();
      const { data, total } = await listNotificationsByUserIdUseCase.execute({
        userId: request.user.sub,
        isRead,
        type,
        channel,
        priority,
        startDate,
        endDate,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / (limit || 20));

      return reply.status(200).send({
        notifications: NotificationPresenter.toHTTPMany(data),
        total,
        totalPages,
      });
    },
  });
}
