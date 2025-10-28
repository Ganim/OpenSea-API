import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { makeCreateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-create-notification-preference-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const bodySchema = z.object({
  userId: z.uuid(),
  alertType: z.enum([
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'EXPIRING_SOON',
    'EXPIRED',
    'PRICE_CHANGE',
    'REORDER_POINT',
  ]),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']),
  isEnabled: z.boolean().optional().default(true),
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

export async function v1CreateNotificationPreferenceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = bodySchema.parse(request.body);

    const useCase = makeCreateNotificationPreferenceUseCase();
    const result = await useCase.execute(data);

    return reply.status(201).send(result);
  } catch (err) {
    if (err instanceof BadRequestError) {
      return reply.status(400).send({ message: err.message });
    }
    throw err;
  }
}

v1CreateNotificationPreferenceController.schema = {
  tags: ['Notification Preferences'],
  summary: 'Create a new notification preference',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({ message: z.string() }),
  },
} as const;
