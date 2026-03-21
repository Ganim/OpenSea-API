import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  connectionResponseSchema,
  createConnectionSchema,
} from '@/http/schemas/sales/marketplaces';
import { makeCreateMarketplaceConnectionUseCase } from '@/use-cases/sales/marketplaces/factories/make-create-marketplace-connection-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createConnectionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplaces/connections',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.REGISTER,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'Create a new marketplace connection',
      body: createConnectionSchema,
      response: {
        201: z.object({
          connection: connectionResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeCreateMarketplaceConnectionUseCase();
      const { connection } = await useCase.execute({
        tenantId,
        platform: body.platform,
        name: body.name,
        sellerId: body.sellerId,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        credentials: body.credentials,
        autoSync: body.autoSync,
        syncIntervalMinutes: body.syncIntervalMinutes,
      });

      return reply.status(201).send({ connection });
    },
  });
}
