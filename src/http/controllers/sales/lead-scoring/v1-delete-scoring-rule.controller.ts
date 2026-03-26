import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteScoringRuleUseCase } from '@/use-cases/sales/lead-scoring/factories/make-delete-scoring-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteScoringRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/lead-scoring/rules/:ruleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_SCORING.REMOVE,
        resource: 'lead-scoring',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Scoring'],
      summary: 'Delete a lead scoring rule (soft delete)',
      params: z.object({ ruleId: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { ruleId } = request.params;

      try {
        const useCase = makeDeleteScoringRuleUseCase();
        const { message } = await useCase.execute({
          tenantId,
          id: ruleId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LEAD_SCORING_RULE_DELETE,
          entityId: ruleId,
          placeholders: {
            ruleName: ruleId,
            userName: request.user.sub,
          },
        });

        return reply.status(200).send({ message });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
