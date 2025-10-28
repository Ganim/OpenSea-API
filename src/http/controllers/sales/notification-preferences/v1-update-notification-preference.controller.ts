import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-update-notification-preference-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z.object({
  isEnabled: z.boolean(),
});

const responseSchema = z.object({
  preference: z.object({
    id: z.uuid(),
    userId: z.uuid(),
    alertType: z.string(),
    channel: z.string(),
    isEnabled: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
  }),
});

export async function v1UpdateNotificationPreferenceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = paramsSchema.parse(request.params);
    const data = bodySchema.parse(request.body);

    const useCase = makeUpdateNotificationPreferenceUseCase();
    const result = await useCase.execute({
      id: params.id,
      ...data,
    });

    return reply.status(200).send(result);
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message });
    }
    throw err;
  }
}

v1UpdateNotificationPreferenceController.schema = {
  tags: ['Notification Preferences'],
  summary: 'Update a notification preference',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  body: bodySchema,
  response: {
    200: responseSchema,
    404: z.object({ message: z.string() }),
  },
} as const;
