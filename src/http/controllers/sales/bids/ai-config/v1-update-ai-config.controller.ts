import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bidAiConfigResponseSchema,
  updateBidAiConfigSchema,
} from '@/http/schemas/sales/bids';
import { makeUpdateBidAiConfigUseCase } from '@/use-cases/sales/bids/factories/make-update-bid-ai-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBidAiConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/bids/ai-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_BOT.ADMIN,
        resource: 'bid-bot',
      }),
    ],
    schema: {
      tags: ['Sales - Bid AI Config'],
      summary: 'Update bid AI configuration',
      body: updateBidAiConfigSchema,
      response: {
        200: z.object({ config: bidAiConfigResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeUpdateBidAiConfigUseCase();
      const { config } = (await useCase.execute({ tenantId, ...body })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_AI_CONFIG_UPDATE,
        entityId: config.id.toString(),
        placeholders: { userName: userId },
        newData: { enabled: body.enabled },
      });

      return reply.status(200).send({ config });
    },
  });
}
