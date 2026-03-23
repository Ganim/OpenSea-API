import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bidItemResponseSchema,
  bidSubResourceQuerySchema,
} from '@/http/schemas/sales/bids/bid.schema';
import { bidItemToDTO } from '@/mappers/sales/bid-item/bid-item-to-dto';
import { makeListBidItemsUseCase } from '@/use-cases/sales/bids/factories/make-list-bid-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBidItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bids/:bidId/items',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BIDS.ACCESS,
        resource: 'bids',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'List items for a bid',
      params: z.object({ bidId: z.string().uuid() }),
      querystring: bidSubResourceQuerySchema,
      response: {
        200: z.object({
          items: z.array(bidItemResponseSchema),
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
      const { bidId } = request.params;
      const { page, limit } = request.query;

      const useCase = makeListBidItemsUseCase();
      const { items, total, totalPages } = await useCase.execute({
        tenantId,
        bidId,
        page,
        limit,
      });

      return reply.status(200).send({
        items: items.map(bidItemToDTO),
        meta: { total, page, limit, pages: totalPages },
      });
    },
  });
}
