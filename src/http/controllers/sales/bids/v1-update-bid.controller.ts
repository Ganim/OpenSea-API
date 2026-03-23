import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateBidSchema,
  bidResponseSchema,
} from '@/http/schemas/sales/bids/bid.schema';
import { bidToDTO } from '@/mappers/sales/bid/bid-to-dto';
import { makeUpdateBidUseCase } from '@/use-cases/sales/bids/factories/make-update-bid-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBidController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/bids/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BIDS.MODIFY,
        resource: 'bids',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'Update a bid/licitacao',
      params: z.object({ id: z.string().uuid() }),
      body: updateBidSchema,
      response: {
        200: z.object({ bid: bidResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      const useCase = makeUpdateBidUseCase();
      const { bid } = await useCase.execute({
        id,
        tenantId,
        userId,
        ...body,
      });

      return reply.status(200).send({ bid: bidToDTO(bid) });
    },
  });
}
