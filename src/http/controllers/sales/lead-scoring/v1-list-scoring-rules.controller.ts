import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { leadScoringRuleResponseSchema } from '@/http/schemas/sales/lead-scoring/lead-scoring.schema';
import { makeListScoringRulesUseCase } from '@/use-cases/sales/lead-scoring/factories/make-list-scoring-rules-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listScoringRulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/lead-scoring/rules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_SCORING.ACCESS,
        resource: 'lead-scoring',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Scoring'],
      summary: 'List lead scoring rules',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          scoringRules: z.array(leadScoringRuleResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;
      const tenantId = request.user.tenantId!;

      const useCase = makeListScoringRulesUseCase();
      const scoringRulesResponse = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send(scoringRulesResponse);
    },
  });
}
