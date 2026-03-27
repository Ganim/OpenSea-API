import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SALES_AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetRoutingRuleByIdUseCase } from '@/use-cases/sales/lead-routing/factories/make-get-routing-rule-by-id-use-case';
import { makeDeleteRoutingRuleUseCase } from '@/use-cases/sales/lead-routing/factories/make-delete-routing-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteRoutingRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/lead-routing/rules/:ruleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_ROUTING.REMOVE,
        resource: 'lead-routing',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Routing'],
      summary: 'Delete a lead routing rule',
      params: z.object({
        ruleId: z.string().uuid().describe('Routing rule ID'),
      }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { ruleId } = request.params;

      try {
        // Get rule name before deleting for audit
        const getRuleUseCase = makeGetRoutingRuleByIdUseCase();
        const { routingRule } = await getRuleUseCase.execute({
          tenantId,
          id: ruleId,
        });

        const deleteUseCase = makeDeleteRoutingRuleUseCase();
        const { message } = await deleteUseCase.execute({
          tenantId,
          id: ruleId,
        });

        await logAudit(request, {
          message: SALES_AUDIT_MESSAGES.LEAD_ROUTING_RULE_DELETE,
          entityId: ruleId,
          placeholders: {
            userName: userId,
            ruleName: routingRule.name,
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
