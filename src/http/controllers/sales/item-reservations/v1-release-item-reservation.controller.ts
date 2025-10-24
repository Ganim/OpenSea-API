import { makeReleaseItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-release-item-reservation-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
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

export async function v1ReleaseItemReservationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  const releaseItemReservationUseCase = makeReleaseItemReservationUseCase();

  const result = await releaseItemReservationUseCase.execute({ id });

  return reply.status(200).send(result);
}

v1ReleaseItemReservationController.schema = {
  tags: ['Item Reservations'],
  summary: 'Release an item reservation',
  description: 'Release a reservation, making the items available again',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    400: z.object({ message: z.string() }),
    404: z.object({ message: z.string() }),
  },
};
