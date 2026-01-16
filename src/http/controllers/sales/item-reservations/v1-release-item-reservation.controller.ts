import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { itemReservationResponseSchema } from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetItemReservationByIdUseCase } from '@/use-cases/sales/item-reservations/factories/make-get-item-reservation-by-id-use-case';
import { makeReleaseItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-release-item-reservation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function releaseItemReservationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/item-reservations/:id/release',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Item Reservations'],
      summary: 'Release an item reservation',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ reservation: itemReservationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getItemReservationByIdUseCase =
          makeGetItemReservationByIdUseCase();

        const [{ user }, { reservation: oldReservation }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getItemReservationByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeReleaseItemReservationUseCase();
        const { reservation } = await useCase.execute({ id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.ITEM_RESERVATION_RELEASE,
          entityId: id,
          placeholders: {
            userName,
            quantity: String(oldReservation.quantity || 1),
            productName: oldReservation.itemId,
          },
          oldData: { quantity: oldReservation.quantity },
        });

        return reply.status(200).send({ reservation });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
