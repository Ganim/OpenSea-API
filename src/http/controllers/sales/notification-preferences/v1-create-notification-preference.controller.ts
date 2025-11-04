import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  createNotificationPreferenceSchema,
  notificationPreferenceResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeCreateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-create-notification-preference-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createNotificationPreferenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notification-preferences',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Notification Preferences'],
      summary: 'Create a new notification preference',
      body: createNotificationPreferenceSchema,
      response: {
        201: z.object({ preference: notificationPreferenceResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateNotificationPreferenceUseCase();
        const { preference } = await useCase.execute(request.body);

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
