import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { materialReturnResponseSchema } from '@/http/schemas/production';
import { materialReturnToDTO } from '@/mappers/production/material-return-to-dto';
import { makeListMaterialReturnsUseCase } from '@/use-cases/production/material-returns/factories/make-list-material-returns-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMaterialReturnsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/material-returns',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.ACCESS,
        resource: 'material-returns',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'List material returns by production order',
      querystring: z.object({
        productionOrderId: z.string().min(1),
      }),
      response: {
        200: z.object({
          materialReturns: z.array(materialReturnResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { productionOrderId } = request.query;

      const listMaterialReturnsUseCase = makeListMaterialReturnsUseCase();
      const { materialReturns } = await listMaterialReturnsUseCase.execute({
        productionOrderId,
      });

      return reply.status(200).send({
        materialReturns: materialReturns.map(materialReturnToDTO),
      });
    },
  });
}
