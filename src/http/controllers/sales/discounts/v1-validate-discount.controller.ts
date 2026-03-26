import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  applicableDiscountSchema,
  validateDiscountSchema,
} from '@/http/schemas/sales/discounts/discount-rule.schema';
import { makeValidateDiscountUseCase } from '@/use-cases/sales/discount-rules/factories/make-validate-discount-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function validateDiscountController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/discounts/validate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DISCOUNTS.ACCESS,
        resource: 'discounts',
      }),
    ],
    schema: {
      tags: ['Sales - Discounts'],
      summary: 'Validate and calculate applicable discounts for a cart',
      body: validateDiscountSchema,
      response: {
        200: z.object({
          applicableDiscounts: z.array(applicableDiscountSchema),
          totalDiscount: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeValidateDiscountUseCase();
      const result = await useCase.execute({ tenantId, ...body });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.DISCOUNT_VALIDATE,
        entityId: tenantId,
        placeholders: {
          userName: request.user.sub,
          itemCount: String(body.cartItems.length),
        },
      });

      return reply.status(200).send(result);
    },
  });
}
