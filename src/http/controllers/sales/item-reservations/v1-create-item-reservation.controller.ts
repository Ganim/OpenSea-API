import { makeCreateItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-create-item-reservation-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const bodySchema = z.object({
  itemId: z.string().uuid(),
  userId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  expiresAt: z.coerce.date(),
});

const responseSchema = z.object({
  reservation: z.object({
    id: z.string(),
    itemId: z.string(),
    userId: z.string(),
    quantity: z.number(),
    reason: z.string().optional(),
    reference: z.string().optional(),
    expiresAt: z.date(),
    releasedAt: z.date().optional(),
    isExpired: z.boolean(),
    isReleased: z.boolean(),
    isActive: z.boolean(),
    createdAt: z.date(),
  }),
});

export async function v1CreateItemReservationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = bodySchema.parse(request.body);

  const createItemReservationUseCase = makeCreateItemReservationUseCase();

  const result = await createItemReservationUseCase.execute(data);

  return reply.status(201).send(result);
}

v1CreateItemReservationController.schema = {
  tags: ['Item Reservations'],
  summary: 'Create a new item reservation',
  description: 'Create a new item reservation for a specific item and user',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({ message: z.string() }),
    404: z.object({ message: z.string() }),
  },
};
