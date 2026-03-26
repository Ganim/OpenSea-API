import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createDiscountRuleSchema,
  discountRuleResponseSchema,
} from '@/http/schemas/sales/discounts/discount-rule.schema';
import { makeCreateDiscountRuleUseCase } from '@/use-cases/sales/discount-rules/factories/make-create-discount-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createDiscountRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/discounts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DISCOUNTS.REGISTER,
        resource: 'discounts',
      }),
    ],
    schema: {
      tags: ['Sales - Discounts'],
      summary: 'Create a new discount rule',
      body: createDiscountRuleSchema,
      response: {
        201: z.object({ discountRule: discountRuleResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateDiscountRuleUseCase();
        const { discountRule } = await useCase.execute({ tenantId, ...body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.DISCOUNT_RULE_CREATE,
          entityId: discountRule.id,
          placeholders: { ruleName: discountRule.name, userName: request.user.sub },
          newData: { name: body.name, type: body.type, value: body.value },
        });

        return reply.status(201).send({ discountRule });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
