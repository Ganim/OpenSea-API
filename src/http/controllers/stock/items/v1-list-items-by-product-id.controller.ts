import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { itemResponseSchema } from '@/http/schemas';
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
      response: {
        200: z.object({
          items: z.array(itemResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productId } = request.params;

      const listItemsByProductIdUseCase = makeListItemsByProductIdUseCase();
      const { items } = await listItemsByProductIdUseCase.execute({
        tenantId,
        productId,
      });

      return reply.status(200).send({ items });
    },
  });
}
