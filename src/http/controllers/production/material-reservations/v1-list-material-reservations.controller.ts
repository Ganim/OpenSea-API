import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { materialReservationResponseSchema } from '@/http/schemas/production';
import { materialReservationToDTO } from '@/mappers/production/material-reservation-to-dto';
import { makeListMaterialReservationsUseCase } from '@/use-cases/production/material-reservations/factories/make-list-material-reservations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMaterialReservationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/material-reservations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.ACCESS,
        resource: 'material-reservations',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'List material reservations by production order',
      querystring: z.object({
        productionOrderId: z.string().min(1),
      }),
      response: {
        200: z.object({
          materialReservations: z.array(materialReservationResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { productionOrderId } = request.query;

      const listMaterialReservationsUseCase =
        makeListMaterialReservationsUseCase();
      const { materialReservations } =
        await listMaterialReservationsUseCase.execute({
          productionOrderId,
        });

      return reply.status(200).send({
        materialReservations: materialReservations.map(
          materialReservationToDTO,
        ),
      });
    },
  });
}
