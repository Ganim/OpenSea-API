import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listBidsQuerySchema,
  bidResponseSchema,
} from '@/http/schemas/sales/bids/bid.schema';
import { bidToDTO } from '@/mappers/sales/bid/bid-to-dto';
import { makeListBidsUseCase } from '@/use-cases/sales/bids/factories/make-list-bids-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBidsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bids',
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
      summary: 'List all bids/licitacoes',
      querystring: listBidsQuerySchema,
      response: {
        200: z.object({
          bids: z.array(bidResponseSchema),
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

      const useCase = makeListBidsUseCase();
      const { bids, total, page, limit, totalPages } = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send({
        bids: bids.map(bidToDTO),
        meta: { total, page, limit, pages: totalPages },
      });
    },
  });
}
