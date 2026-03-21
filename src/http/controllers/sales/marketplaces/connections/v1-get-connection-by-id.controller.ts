import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { connectionResponseSchema } from '@/http/schemas/sales/marketplaces';
import { makeGetMarketplaceConnectionByIdUseCase } from '@/use-cases/sales/marketplaces/factories/make-get-marketplace-connection-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getConnectionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplaces/connections/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.ACCESS,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'Get a marketplace connection by ID',
      params: z.object({
        id: z.string().uuid().describe('Connection UUID'),
      }),
      response: {
        200: z.object({
          connection: connectionResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetMarketplaceConnectionByIdUseCase();
      const { connection } = await useCase.execute({ id, tenantId });

      return reply.status(200).send({ connection });
    },
  });
}
