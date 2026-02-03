import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createItemReservationSchema,
  itemReservationResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-create-item-reservation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createItemReservationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/item-reservations',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Item Reservations'],
      summary: 'Create a new item reservation',
      body: createItemReservationSchema,
      response: {
        201: z.object({ reservation: itemReservationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateItemReservationUseCase();
        const { reservation } = await useCase.execute({ ...data, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.ITEM_RESERVATION_CREATE,
          entityId: reservation.id,
          placeholders: {
            userName,
            quantity: String(data.quantity || 1),
            productName: data.itemId,
            orderNumber: data.reference || 'N/A',
          },
          newData: {
            itemId: data.itemId,
            quantity: data.quantity,
            reference: data.reference,
          },
        });

        return reply.status(201).send({ reservation });
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
