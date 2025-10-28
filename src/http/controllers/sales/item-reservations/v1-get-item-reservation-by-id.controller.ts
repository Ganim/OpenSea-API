import { makeGetItemReservationByIdUseCase } from '@/use-cases/sales/item-reservations/factories/make-get-item-reservation-by-id-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.uuid(),
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

export async function v1GetItemReservationByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  const getItemReservationByIdUseCase = makeGetItemReservationByIdUseCase();

  const result = await getItemReservationByIdUseCase.execute({ id });

  return reply.status(200).send(result);
}

v1GetItemReservationByIdController.schema = {
  tags: ['Item Reservations'],
  summary: 'Get item reservation by ID',
  description: 'Get detailed information about a specific item reservation',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({ message: z.string() }),
  },
};
