import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createMaterialReservationSchema,
  materialReservationResponseSchema,
} from '@/http/schemas/production';
import { materialReservationToDTO } from '@/mappers/production/material-reservation-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateMaterialReservationUseCase } from '@/use-cases/production/material-reservations/factories/make-create-material-reservation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createMaterialReservationController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/material-reservations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.REGISTER,
        resource: 'material-reservations',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'Create a material reservation',
      body: createMaterialReservationSchema,
      response: {
        201: z.object({
          materialReservation: materialReservationResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { productionOrderId, materialId, warehouseId, quantityReserved } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createMaterialReservationUseCase =
        makeCreateMaterialReservationUseCase();
      const { materialReservation } =
        await createMaterialReservationUseCase.execute({
          productionOrderId,
          materialId,
          warehouseId,
          quantityReserved,
        });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.MATERIAL_RESERVATION_CREATE,
        entityId: materialReservation.materialReservationId.toString(),
        placeholders: { userName, orderNumber: productionOrderId },
        newData: {
          productionOrderId,
          materialId,
          warehouseId,
          quantityReserved,
        },
      });

      return reply.status(201).send({
        materialReservation: materialReservationToDTO(materialReservation),
      });
    },
  });
}
