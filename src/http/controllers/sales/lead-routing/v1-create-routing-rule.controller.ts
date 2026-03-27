import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { SALES_AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createLeadRoutingRuleSchema,
  leadRoutingRuleResponseSchema,
} from '@/http/schemas';
import { leadRoutingRuleToDTO } from '@/mappers/sales/lead-routing-rule/lead-routing-rule-to-dto';
import { makeCreateRoutingRuleUseCase } from '@/use-cases/sales/lead-routing/factories/make-create-routing-rule-use-case';
import type { LeadRoutingStrategy } from '@/entities/sales/lead-routing-rule';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createRoutingRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/lead-routing/rules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_ROUTING.REGISTER,
        resource: 'lead-routing',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Routing'],
      summary: 'Create a new lead routing rule',
      body: createLeadRoutingRuleSchema,
      response: {
        201: z.object({ routingRule: leadRoutingRuleResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      try {
        const useCase = makeCreateRoutingRuleUseCase();
        const { routingRule } = await useCase.execute({
          tenantId,
          name: body.name,
          strategy: body.strategy as LeadRoutingStrategy,
          config: body.config,
          assignToUsers: body.assignToUsers,
          maxLeadsPerUser: body.maxLeadsPerUser,
          isActive: body.isActive,
        });

        await logAudit(request, {
          message: SALES_AUDIT_MESSAGES.LEAD_ROUTING_RULE_CREATE,
          entityId: routingRule.id.toString(),
          placeholders: {
            userName: userId,
            ruleName: routingRule.name,
          },
          newData: {
            name: body.name,
            strategy: body.strategy,
          },
        });

        return reply.status(201).send({
          routingRule: leadRoutingRuleToDTO(routingRule),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
