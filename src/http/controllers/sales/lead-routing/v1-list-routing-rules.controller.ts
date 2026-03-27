import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  leadRoutingRuleResponseSchema,
  listLeadRoutingRulesQuerySchema,
} from '@/http/schemas';
import { leadRoutingRuleToDTO } from '@/mappers/sales/lead-routing-rule/lead-routing-rule-to-dto';
import { makeListRoutingRulesUseCase } from '@/use-cases/sales/lead-routing/factories/make-list-routing-rules-use-case';
import type { LeadRoutingStrategy } from '@/entities/sales/lead-routing-rule';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listRoutingRulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/lead-routing/rules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_ROUTING.ACCESS,
        resource: 'lead-routing',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Routing'],
      summary: 'List all lead routing rules',
      querystring: listLeadRoutingRulesQuerySchema,
      response: {
        200: z.object({
          routingRules: z.array(leadRoutingRuleResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, search, strategy, isActive } = request.query;

      const useCase = makeListRoutingRulesUseCase();
      const { routingRules } = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        strategy: strategy as LeadRoutingStrategy | undefined,
        isActive,
      });

      return reply.status(200).send({
        routingRules: routingRules.data.map(leadRoutingRuleToDTO),
        meta: {
          total: routingRules.total,
          page: routingRules.page,
          limit: routingRules.limit,
          pages: routingRules.totalPages,
        },
      });
    },
  });
}
