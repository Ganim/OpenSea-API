import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { leadRoutingRuleResponseSchema } from '@/http/schemas';
import { leadRoutingRuleToDTO } from '@/mappers/sales/lead-routing-rule/lead-routing-rule-to-dto';
import { makeGetRoutingRuleByIdUseCase } from '@/use-cases/sales/lead-routing/factories/make-get-routing-rule-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getRoutingRuleByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/lead-routing/rules/:ruleId',
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
      summary: 'Get a lead routing rule by ID',
      params: z.object({
        ruleId: z.string().uuid().describe('Routing rule ID'),
      }),
      response: {
        200: z.object({ routingRule: leadRoutingRuleResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { ruleId } = request.params;

      try {
        const useCase = makeGetRoutingRuleByIdUseCase();
        const { routingRule } = await useCase.execute({
          tenantId,
          id: ruleId,
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
