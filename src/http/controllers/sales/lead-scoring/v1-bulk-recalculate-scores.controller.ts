import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeBulkRecalculateScoresUseCase } from '@/use-cases/sales/lead-scoring/factories/make-bulk-recalculate-scores-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function bulkRecalculateScoresController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/lead-scoring/recalculate-all',
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
      summary: 'Recalculate lead scores for all customers in the tenant',
      response: {
        200: z.object({
          processedCount: z.number(),
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeBulkRecalculateScoresUseCase();
      const { processedCount, message } = await useCase.execute({
        tenantId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.LEAD_SCORE_BULK_RECALCULATE,
        entityId: tenantId,
        placeholders: {
          userName: request.user.sub,
          processedCount: String(processedCount),
        },
      });

      return reply.status(200).send({ processedCount, message });
    },
  });
}
