import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SALES_AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { routeLeadResponseSchema } from '@/http/schemas';
import { makeRouteLeadUseCase } from '@/use-cases/sales/lead-routing/factories/make-route-lead-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function routeLeadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/lead-routing/route/:customerId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LEAD_ROUTING.ADMIN,
        resource: 'lead-routing',
      }),
    ],
    schema: {
      tags: ['Sales - Lead Routing'],
      summary: 'Route a lead/customer to a user based on active routing rules',
      params: z.object({
        customerId: z.string().uuid().describe('Customer ID to route'),
      }),
      response: {
        200: routeLeadResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { customerId } = request.params;

      try {
        const useCase = makeRouteLeadUseCase();
        const routingResult = await useCase.execute({
          tenantId,
          customerId,
        });

        await logAudit(request, {
          message: SALES_AUDIT_MESSAGES.LEAD_ROUTING_EXECUTED,
          entityId: customerId,
          placeholders: {
            userName: userId,
            customerName: customerId,
            assignedUser: routingResult.assignedToUserId,
            ruleName: routingResult.routingRuleName,
            strategy: routingResult.strategy,
          },
          newData: {
            customerId,
            assignedToUserId: routingResult.assignedToUserId,
            ruleName: routingResult.routingRuleName,
            strategy: routingResult.strategy,
          },
        });

        return reply.status(200).send(routingResult);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
