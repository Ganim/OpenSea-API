import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateMarketplaceConnectionUseCase } from '@/use-cases/sales/marketplace-connections/factories/make-create-marketplace-connection-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateConnectionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplace-connections',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.REGISTER,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Connections'],
      summary: 'Create a new marketplace connection',
      body: z.object({
        marketplace: z.enum(['MERCADO_LIVRE', 'SHOPEE', 'AMAZON', 'MAGALU', 'TIKTOK_SHOP', 'AMERICANAS', 'ALIEXPRESS', 'CASAS_BAHIA', 'SHEIN', 'CUSTOM']),
        name: z.string().min(1).max(128),
        sellerId: z.string().optional(),
        sellerName: z.string().optional(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: z.string().datetime().optional(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        syncProducts: z.boolean().optional(),
        syncPrices: z.boolean().optional(),
        syncStock: z.boolean().optional(),
        syncOrders: z.boolean().optional(),
        syncMessages: z.boolean().optional(),
        syncIntervalMin: z.number().int().min(1).optional(),
        priceTableId: z.string().uuid().optional(),
        commissionPercent: z.number().min(0).max(100).optional(),
        autoCalcPrice: z.boolean().optional(),
        priceMultiplier: z.number().min(0).optional(),
        fulfillmentType: z.enum(['SELF', 'MARKETPLACE', 'HYBRID']).optional(),
        defaultWarehouseId: z.string().uuid().optional(),
        settings: z.record(z.unknown()).optional(),
      }),
      response: {
        201: z.object({ connection: z.any() }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;
      try {
        const useCase = makeCreateMarketplaceConnectionUseCase();
        const result = await useCase.execute({
          tenantId,
          ...data,
          tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : undefined,
        });
        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
