import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { leadScoreResponseSchema } from '@/http/schemas/sales/lead-scoring/lead-scoring.schema';
import { makeCalculateLeadScoreUseCase } from '@/use-cases/sales/lead-scoring/factories/make-calculate-lead-score-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function calculateLeadScoreController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/lead-scoring/calculate/:customerId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_SCORING.ADMIN,
        resource: 'lead-scoring',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Scoring'],
      summary: 'Calculate lead score for a specific customer',
      params: z.object({ customerId: z.string().uuid() }),
      response: {
        200: z.object({ leadScore: leadScoreResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { customerId } = request.params;

      try {
        const useCase = makeCalculateLeadScoreUseCase();
        const { leadScore } = await useCase.execute({
          tenantId,
          customerId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LEAD_SCORE_CALCULATE,
          entityId: leadScore.id,
          placeholders: {
            userName: request.user.sub,
            customerId,
            score: String(leadScore.score),
            tier: leadScore.tier,
          },
          newData: {
            score: leadScore.score,
            tier: leadScore.tier,
            factorsCount: leadScore.factors.length,
          },
        });

        return reply.status(200).send({ leadScore });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
