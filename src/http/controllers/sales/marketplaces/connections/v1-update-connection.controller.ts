import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateMarketplaceConnectionUseCase } from '@/use-cases/sales/marketplace-connections/factories/make-update-marketplace-connection-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdateConnectionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/marketplace-connections/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.MODIFY,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Connections'],
      summary: 'Update marketplace connection',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(128).optional(),
        status: z
          .enum(['ACTIVE', 'PAUSED', 'DISCONNECTED', 'ERROR'])
          .optional(),
        sellerName: z.string().optional(),
        syncProducts: z.boolean().optional(),
        syncPrices: z.boolean().optional(),
        syncStock: z.boolean().optional(),
        syncOrders: z.boolean().optional(),
        syncMessages: z.boolean().optional(),
        syncIntervalMin: z.number().int().min(1).optional(),
        commissionPercent: z.number().min(0).max(100).optional(),
        autoCalcPrice: z.boolean().optional(),
        priceMultiplier: z.number().min(0).optional(),
        fulfillmentType: z.enum(['SELF', 'MARKETPLACE', 'HYBRID']).optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      }),
      response: {
        200: z.object({ connection: z.any() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const data = request.body;
      try {
        const useCase = makeUpdateMarketplaceConnectionUseCase();
        const result = await useCase.execute({ tenantId, id, ...data });
        return reply.status(200).send(result);
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
