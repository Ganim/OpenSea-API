import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema, itemResponseSchema } from '@/http/schemas';
import { makeListItemsByProductIdUseCase } from '@/use-cases/stock/items/factories/make-list-items-by-product-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemsByProductIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/by-product/:productId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.LIST,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'List items by product ID',
      params: z.object({
        productId: z.uuid(),
      }),
      querystring: paginationSchema,
      response: {
        200: z.object({
          items: z.array(itemResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productId } = request.params;
      const { page, limit } = request.query;

      const listItemsByProductIdUseCase = makeListItemsByProductIdUseCase();
      const result = await listItemsByProductIdUseCase.execute({
        tenantId,
        productId,
        page,
        limit,
      });

      return reply.status(200).send(result);
    },
  });
}
