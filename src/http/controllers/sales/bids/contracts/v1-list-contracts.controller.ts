import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bidContractResponseSchema,
  listBidContractsQuerySchema,
} from '@/http/schemas/sales/bids';
import { makeListBidContractsUseCase } from '@/use-cases/sales/bids/factories/make-list-bid-contracts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBidContractsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bid-contracts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_CONTRACTS.ACCESS,
        resource: 'bid-contracts',
      }),
    ],
    schema: {
      tags: ['Sales - Bid Contracts'],
      summary: 'List bid contracts',
      querystring: listBidContractsQuerySchema,
      response: {
        200: z.object({
          contracts: z.array(bidContractResponseSchema),
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

      const useCase = makeListBidContractsUseCase();
      const { contracts, total, totalPages } = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send({
        contracts,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          pages: totalPages,
        },
      });
    },
  });
}
