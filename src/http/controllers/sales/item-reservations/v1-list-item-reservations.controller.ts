import { makeListItemReservationsUseCase } from '@/use-cases/sales/item-reservations/factories/make-list-item-reservations-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const querySchema = z.object({
  itemId: z.uuid().optional(),
  userId: z.uuid().optional(),
  activeOnly: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

const responseSchema = z.object({
  reservations: z.array(
    z.object({
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
  ),
});

export async function v1ListItemReservationsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = querySchema.parse(request.query);

  const listItemReservationsUseCase = makeListItemReservationsUseCase();

  const result = await listItemReservationsUseCase.execute(data);

  return reply.status(200).send(result);
}

v1ListItemReservationsController.schema = {
  tags: ['Item Reservations'],
  summary: 'List item reservations',
  description:
    'List item reservations with optional filters (itemId, userId, activeOnly)',
  security: [{ bearerAuth: [] }],
  querystring: querySchema,
  response: {
    200: responseSchema,
  },
};
