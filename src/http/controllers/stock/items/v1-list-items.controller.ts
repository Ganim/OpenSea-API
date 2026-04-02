import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { itemResponseSchema } from '@/http/schemas';
import { makeListItemsUseCase } from '@/use-cases/stock/items/factories/make-list-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.ACCESS,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'List all items',
      querystring: paginationSchema.extend({
        variantId: z.uuid().optional(),
        binId: z.uuid().optional(),
        productId: z.uuid().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        manufacturerId: z.uuid().optional(),
        zoneId: z.uuid().optional(),
        hideEmpty: z.coerce.boolean().optional(),
        updatedFrom: z.coerce.date().optional(),
        updatedTo: z.coerce.date().optional(),
        sortBy: z
          .enum([
            'name',
            'fullCode',
            'currentQuantity',
            'entryDate',
            'manufacturerName',
            'binAddress',
            'createdAt',
          ])
          .optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
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
      const {
        variantId,
        binId,
        productId,
        status,
        search,
        manufacturerId,
        zoneId,
        hideEmpty,
        updatedFrom,
        updatedTo,
        sortBy,
        sortOrder,
        page,
        limit,
      } = request.query;

      const listItemsUseCase = makeListItemsUseCase();
      const result = await listItemsUseCase.execute({
        tenantId,
        variantId,
        binId,
        productId,
        status,
        search,
        manufacturerId,
        zoneId,
        hideEmpty,
        updatedFrom,
        updatedTo,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return reply.status(200).send(result);
    },
  });
}
