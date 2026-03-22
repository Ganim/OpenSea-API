import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidResponseSchema } from '@/http/schemas/sales/bids/bid.schema';
import { bidToDTO } from '@/mappers/sales/bid/bid-to-dto';
import { makeGetBidByIdUseCase } from '@/use-cases/sales/bids/factories/make-get-bid-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBidByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bids/:id',
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
      summary: 'Get bid details by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ bid: bidResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetBidByIdUseCase();
      const { bid } = await useCase.execute({ id, tenantId });

      return reply.status(200).send({ bid: bidToDTO(bid) });
    },
  });
}
