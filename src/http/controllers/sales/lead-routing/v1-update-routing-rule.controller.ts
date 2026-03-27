import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SALES_AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  leadRoutingRuleResponseSchema,
  updateLeadRoutingRuleSchema,
} from '@/http/schemas';
import { leadRoutingRuleToDTO } from '@/mappers/sales/lead-routing-rule/lead-routing-rule-to-dto';
import { makeUpdateRoutingRuleUseCase } from '@/use-cases/sales/lead-routing/factories/make-update-routing-rule-use-case';
import type { LeadRoutingStrategy } from '@/entities/sales/lead-routing-rule';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateRoutingRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/sales/lead-routing/rules/:ruleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_ROUTING.MODIFY,
        resource: 'lead-routing',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Routing'],
      summary: 'Update a lead routing rule',
      params: z.object({
        ruleId: z.string().uuid().describe('Routing rule ID'),
      }),
      body: updateLeadRoutingRuleSchema,
      response: {
        200: z.object({ routingRule: leadRoutingRuleResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { ruleId } = request.params;
      const body = request.body;

      try {
        const useCase = makeUpdateRoutingRuleUseCase();
        const { routingRule } = await useCase.execute({
          tenantId,
          id: ruleId,
          name: body.name,
          strategy: body.strategy as LeadRoutingStrategy | undefined,
          config: body.config,
          assignToUsers: body.assignToUsers,
          maxLeadsPerUser: body.maxLeadsPerUser,
          isActive: body.isActive,
        });

        await logAudit(request, {
          message: SALES_AUDIT_MESSAGES.LEAD_ROUTING_RULE_UPDATE,
          entityId: routingRule.id.toString(),
          placeholders: {
            userName: userId,
            ruleName: routingRule.name,
          },
          newData: body as Record<string, unknown>,
        });

        return reply.status(200).send({
          routingRule: leadRoutingRuleToDTO(routingRule),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
