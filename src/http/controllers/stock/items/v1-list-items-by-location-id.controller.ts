import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { itemResponseSchema } from '@/http/schemas';
import { makeListItemsByLocationIdUseCase } from '@/use-cases/stock/items/factories/make-list-items-by-location-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemsByLocationIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/by-location/:locationId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.LIST,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'List items by location ID',
      params: z.object({
        locationId: z.uuid(),
      }),
      response: {
        200: z.object({
          items: z.array(itemResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { locationId } = request.params;

      const listItemsByLocationIdUseCase = makeListItemsByLocationIdUseCase();
      const { items } = await listItemsByLocationIdUseCase.execute({
        locationId,
      });

      return reply.status(200).send({ items });
    },
  });
}
