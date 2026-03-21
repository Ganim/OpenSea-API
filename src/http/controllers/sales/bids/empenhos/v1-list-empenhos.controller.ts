import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidEmpenhoResponseSchema, listBidEmpenhosQuerySchema } from '@/http/schemas/sales/bids';
import { makeListBidEmpenhosUseCase } from '@/use-cases/sales/bids/factories/make-list-bid-empenhos-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBidEmpenhosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bid-empenhos',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_EMPENHOS.ACCESS,
        resource: 'bid-empenhos',
      }),
    ],
    schema: {
      tags: ['Sales - Bid Empenhos'],
      summary: 'List bid empenhos',
      querystring: listBidEmpenhosQuerySchema,
      response: {
        200: z.object({
          empenhos: z.array(bidEmpenhoResponseSchema),
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
      const query = request.query;

      const useCase = makeListBidEmpenhosUseCase();
      const { empenhos, total, totalPages } = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send({
        empenhos,
        meta: { total, page: query.page, limit: query.limit, pages: totalPages },
      });
    },
  });
}
