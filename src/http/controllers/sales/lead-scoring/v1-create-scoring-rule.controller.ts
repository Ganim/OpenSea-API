import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createScoringRuleSchema,
  leadScoringRuleResponseSchema,
} from '@/http/schemas/sales/lead-scoring/lead-scoring.schema';
import { makeCreateScoringRuleUseCase } from '@/use-cases/sales/lead-scoring/factories/make-create-scoring-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createScoringRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/lead-scoring/rules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_SCORING.REGISTER,
        resource: 'lead-scoring',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Scoring'],
      summary: 'Create a new lead scoring rule',
      body: createScoringRuleSchema,
      response: {
        201: z.object({ scoringRule: leadScoringRuleResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateScoringRuleUseCase();
        const { scoringRule } = await useCase.execute({
          tenantId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LEAD_SCORING_RULE_CREATE,
          entityId: scoringRule.id,
          placeholders: {
            ruleName: scoringRule.name,
            userName: request.user.sub,
          },
          newData: {
            name: body.name,
            field: body.field,
            condition: body.condition,
            points: body.points,
          },
        });

        return reply.status(201).send({ scoringRule });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
