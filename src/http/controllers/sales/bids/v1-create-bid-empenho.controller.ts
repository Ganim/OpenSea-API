import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createBidEmpenhoSchema, bidEmpenhoResponseSchema } from '@/http/schemas/sales/bids/bid.schema';
import { bidEmpenhoToDTO } from '@/mappers/sales/bid-empenho/bid-empenho-to-dto';
import { makeCreateBidEmpenhoUseCase } from '@/use-cases/sales/bids/factories/make-create-bid-empenho-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBidEmpenhoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/bid-empenhos',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_EMPENHOS.REGISTER,
        resource: 'bid-empenhos',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'Register a nota de empenho',
      body: createBidEmpenhoSchema,
      response: {
        201: z.object({ empenho: bidEmpenhoResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeCreateBidEmpenhoUseCase();
      const { empenho } = await useCase.execute({
        tenantId,
        ...body,
      });

      return reply.status(201).send({ empenho: bidEmpenhoToDTO(empenho) });
    },
  });
}
