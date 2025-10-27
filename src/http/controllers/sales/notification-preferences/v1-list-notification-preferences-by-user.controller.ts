import { makeListNotificationPreferencesByUserUseCase } from '@/use-cases/sales/notification-preferences/factories/make-list-notification-preferences-by-user-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const querySchema = z.object({
  userId: z.string().uuid(),
  enabledOnly: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

const responseSchema = z.object({
  preferences: z.array(
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      alertType: z.string(),
      channel: z.string(),
      isEnabled: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date().optional(),
    }),
  ),
});

export async function v1ListNotificationPreferencesByUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = querySchema.parse(request.query);

  const useCase = makeListNotificationPreferencesByUserUseCase();
  const result = await useCase.execute(data);

  return reply.status(200).send(result);
}

v1ListNotificationPreferencesByUserController.schema = {
  tags: ['Notification Preferences'],
  summary: 'List notification preferences by user',
  security: [{ bearerAuth: [] }],
  querystring: querySchema,
  response: {
    200: responseSchema,
  },
} as const;
