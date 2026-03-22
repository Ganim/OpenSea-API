import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createBidSchema, bidResponseSchema } from '@/http/schemas/sales/bids/bid.schema';
import { bidToDTO } from '@/mappers/sales/bid/bid-to-dto';
import { makeCreateBidUseCase } from '@/use-cases/sales/bids/factories/make-create-bid-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBidController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/bids',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BIDS.REGISTER,
        resource: 'bids',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'Create a new bid/licitacao',
      body: createBidSchema,
      response: {
        201: z.object({ bid: bidResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateBidUseCase();
      const { bid } = await useCase.execute({
        tenantId,
        userId,
        ...body,
      });

      return reply.status(201).send({ bid: bidToDTO(bid) });
    },
  });
}
