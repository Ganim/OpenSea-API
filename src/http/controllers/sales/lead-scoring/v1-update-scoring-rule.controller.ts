import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  leadScoringRuleResponseSchema,
  updateScoringRuleSchema,
} from '@/http/schemas/sales/lead-scoring/lead-scoring.schema';
import { makeUpdateScoringRuleUseCase } from '@/use-cases/sales/lead-scoring/factories/make-update-scoring-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateScoringRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/lead-scoring/rules/:ruleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_SCORING.MODIFY,
        resource: 'lead-scoring',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Scoring'],
      summary: 'Update a lead scoring rule',
      params: z.object({ ruleId: z.string().uuid() }),
      body: updateScoringRuleSchema,
      response: {
        200: z.object({ scoringRule: leadScoringRuleResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { ruleId } = request.params;
      const body = request.body;

      try {
        const useCase = makeUpdateScoringRuleUseCase();
        const { scoringRule } = await useCase.execute({
          tenantId,
          id: ruleId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LEAD_SCORING_RULE_UPDATE,
          entityId: scoringRule.id,
          placeholders: {
            ruleName: scoringRule.name,
            userName: request.user.sub,
          },
          newData: body as Record<string, unknown>,
        });

        return reply.status(200).send({ scoringRule });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
