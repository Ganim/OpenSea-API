import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { materialReservationResponseSchema } from '@/http/schemas/production';
import { materialReservationToDTO } from '@/mappers/production/material-reservation-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCancelMaterialReservationUseCase } from '@/use-cases/production/material-reservations/factories/make-cancel-material-reservation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function cancelMaterialReservationController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/material-reservations/:id/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.ADMIN,
        resource: 'material-reservations',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'Cancel a material reservation',
      params: z.object({
        id: z.string().min(1),
      }),
      response: {
        200: z.object({
          materialReservation: materialReservationResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const cancelMaterialReservationUseCase =
        makeCancelMaterialReservationUseCase();
      const { materialReservation } =
        await cancelMaterialReservationUseCase.execute({
          reservationId: id,
        });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.MATERIAL_RESERVATION_CANCEL,
        entityId: materialReservation.materialReservationId.toString(),
        placeholders: {
          userName,
          orderNumber: materialReservation.productionOrderId.toString(),
        },
      });

      return reply.status(200).send({
        materialReservation: materialReservationToDTO(materialReservation),
      });
    },
  });
}
