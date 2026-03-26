import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { discountRuleResponseSchema } from '@/http/schemas/sales/discounts/discount-rule.schema';
import { makeListDiscountRulesUseCase } from '@/use-cases/sales/discount-rules/factories/make-list-discount-rules-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listDiscountsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/discounts',
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
      summary: 'List discount rules',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          discountRules: z.array(discountRuleResponseSchema),
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

      const useCase = makeListDiscountRulesUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result);
    },
  });
}
