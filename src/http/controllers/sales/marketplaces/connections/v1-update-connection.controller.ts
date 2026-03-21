import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  connectionResponseSchema,
  updateConnectionSchema,
} from '@/http/schemas/sales/marketplaces';
import { makeUpdateMarketplaceConnectionUseCase } from '@/use-cases/sales/marketplaces/factories/make-update-marketplace-connection-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateConnectionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/marketplaces/connections/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.MODIFY,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'Update a marketplace connection',
      params: z.object({
        id: z.string().uuid().describe('Connection UUID'),
      }),
      body: updateConnectionSchema,
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
      const body = request.body;

      const useCase = makeUpdateMarketplaceConnectionUseCase();
      const { connection } = await useCase.execute({
        id,
        tenantId,
        ...body,
      });

      return reply.status(200).send({ connection });
    },
  });
}
