import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bidEmpenhoResponseSchema,
  createBidEmpenhoSchema,
} from '@/http/schemas/sales/bids';
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
      tags: ['Sales - Bid Empenhos'],
      summary: 'Create a bid empenho (nota de empenho)',
      body: createBidEmpenhoSchema,
      response: {
        201: z.object({ empenho: bidEmpenhoResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateBidEmpenhoUseCase();
      const { empenho } = await useCase.execute({ tenantId, ...body });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_EMPENHO_CREATE,
        entityId: empenho.id.toString(),
        placeholders: { userName: userId, empenhoNumber: body.empenhoNumber },
        newData: {
          empenhoNumber: body.empenhoNumber,
          bidId: body.bidId,
          value: body.value,
        },
      });

      return reply.status(201).send({ empenho });
    },
  });
}
