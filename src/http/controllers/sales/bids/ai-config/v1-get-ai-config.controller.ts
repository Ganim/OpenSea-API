import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidAiConfigResponseSchema } from '@/http/schemas/sales/bids';
import { makeGetBidAiConfigUseCase } from '@/use-cases/sales/bids/factories/make-get-bid-ai-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBidAiConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bids/ai-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_BOT.ACCESS,
        resource: 'bid-bot',
      }),
    ],
    schema: {
      tags: ['Sales - Bid AI Config'],
      summary: 'Get bid AI configuration',
      response: {
        200: z.object({ config: bidAiConfigResponseSchema }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetBidAiConfigUseCase();
      const { config } = (await useCase.execute({ tenantId })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      return reply.status(200).send({ config });
    },
  });
}
