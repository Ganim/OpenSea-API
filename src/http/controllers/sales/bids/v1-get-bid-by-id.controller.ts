import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidResponseSchema } from '@/http/schemas/sales/bids';
import { makeGetBidByIdUseCase } from '@/use-cases/sales/bids/factories/make-get-bid-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBidByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bids/:bidId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BIDS.ACCESS,
        resource: 'bids',
      }),
    ],
    schema: {
      tags: ['Sales - Bids'],
      summary: 'Get a bid by ID',
      params: z.object({
        bidId: z.string().uuid().describe('Bid UUID'),
      }),
      response: {
        200: z.object({ bid: bidResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { bidId } = request.params;

      const useCase = makeGetBidByIdUseCase();
      const { bid } = await useCase.execute({ id: bidId, tenantId });

      return reply.status(200).send({ bid });
    },
  });
}
