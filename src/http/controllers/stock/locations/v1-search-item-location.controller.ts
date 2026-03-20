import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  searchItemLocationQuerySchema,
  searchItemLocationResponseSchema,
} from '@/http/schemas/stock/locations/location.schema';
import { makeSearchItemLocationUseCase } from '@/use-cases/stock/items/factories/make-search-item-location-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function searchItemLocationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/search-location',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.ACCESS,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Locations'],
      summary: 'Search items by name, SKU, or barcode with location info',
      description:
        'Search items by product name, variant name, SKU, barcode, or code. Returns matching items with their current location (bin, zone, warehouse).',
      querystring: searchItemLocationQuerySchema,
      response: {
        200: searchItemLocationResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { q: searchQuery, limit } = request.query;

      const searchItemLocationUseCase = makeSearchItemLocationUseCase();

      const { items } = await searchItemLocationUseCase.execute({
        tenantId,
        query: searchQuery,
        limit,
      });

      return reply.status(200).send({ items });
    },
  });
}
