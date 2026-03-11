import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema, itemResponseSchema } from '@/http/schemas';
import { makeListItemsByVariantIdUseCase } from '@/use-cases/stock/items/factories/make-list-items-by-variant-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemsByVariantIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/by-variant/:variantId',
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
      summary: 'List items by variant ID',
      params: z.object({
        variantId: z.uuid(),
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
      const { variantId } = request.params;
      const { page, limit } = request.query;

      const listItemsByVariantIdUseCase = makeListItemsByVariantIdUseCase();
      const result = await listItemsByVariantIdUseCase.execute({
        tenantId,
        variantId,
        page,
        limit,
      });

      return reply.status(200).send(result);
    },
  });
}
