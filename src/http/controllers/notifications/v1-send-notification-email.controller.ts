import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeSendEmailNotificationUseCase } from '@/use-cases/notifications/factories/make-send-email-notification-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function sendNotificationEmailController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notifications/:id/send',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications'],
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
      return reply.status(200).send({ success: result.success, notification: { id: result.notification.id } });
    },
  });
}
