import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { operationRoutingResponseSchema } from '@/http/schemas/production';
import { operationRoutingToDTO } from '@/mappers/production/operation-routing-to-dto';
import { makeListOperationRoutingsUseCase } from '@/use-cases/production/operation-routings/factories/make-list-operation-routings-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listOperationRoutingsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/boms/:bomId/routings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'operation-routings',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'List all operation routing steps for a BOM',
      params: z.object({
        bomId: z.string(),
      }),
      response: {
        200: z.object({
          operationRoutings: z.array(operationRoutingResponseSchema),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { bomId } = request.params;

      const listOperationRoutingsUseCase = makeListOperationRoutingsUseCase();
      const { operationRoutings } = await listOperationRoutingsUseCase.execute({
        tenantId,
        bomId,
      });

      return reply.status(200).send({
        operationRoutings: operationRoutings.map(operationRoutingToDTO),
      });
    },
  });
}
