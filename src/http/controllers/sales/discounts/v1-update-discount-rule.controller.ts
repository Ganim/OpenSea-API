import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  discountRuleResponseSchema,
  updateDiscountRuleSchema,
} from '@/http/schemas/sales/discounts/discount-rule.schema';
import { makeUpdateDiscountRuleUseCase } from '@/use-cases/sales/discount-rules/factories/make-update-discount-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateDiscountRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/discounts/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DISCOUNTS.MODIFY,
        resource: 'discounts',
      }),
    ],
    schema: {
      tags: ['Sales - Discounts'],
      summary: 'Update a discount rule',
      params: z.object({ id: z.string().uuid() }),
      body: updateDiscountRuleSchema,
      response: {
        200: z.object({ discountRule: discountRuleResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeUpdateDiscountRuleUseCase();
        const { discountRule } = await useCase.execute({ tenantId, id, ...body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.DISCOUNT_RULE_UPDATE,
          entityId: id,
          placeholders: { ruleName: discountRule.name, userName: request.user.sub },
          newData: body,
        });

        return reply.status(200).send({ discountRule });
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
