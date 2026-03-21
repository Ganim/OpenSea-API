import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidHistoryResponseSchema, bidSubResourceQuerySchema } from '@/http/schemas/sales/bids/bid.schema';
import { bidHistoryToDTO } from '@/mappers/sales/bid-history/bid-history-to-dto';
import { makeListBidHistoryUseCase } from '@/use-cases/sales/bids/factories/make-list-bid-history-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBidHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bids/:bidId/history',
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
      summary: 'List bid history (audit trail)',
      params: z.object({ bidId: z.string().uuid() }),
      querystring: bidSubResourceQuerySchema,
      response: {
        200: z.object({
          history: z.array(bidHistoryResponseSchema),
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

      const useCase = makeListBidHistoryUseCase();
      const { history, total, totalPages } = await useCase.execute({
        tenantId,
        bidId,
        page,
        limit,
      });

      return reply.status(200).send({
        history: history.map(bidHistoryToDTO),
        meta: { total, page, limit, pages: totalPages },
      });
    },
  });
}
