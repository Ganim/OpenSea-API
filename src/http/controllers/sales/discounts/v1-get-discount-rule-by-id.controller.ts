import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { discountRuleResponseSchema } from '@/http/schemas/sales/discounts/discount-rule.schema';
import { makeGetDiscountRuleByIdUseCase } from '@/use-cases/sales/discount-rules/factories/make-get-discount-rule-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getDiscountRuleByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/discount-rules/:id',
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
      summary: 'Get discount rule by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ discountRule: discountRuleResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetDiscountRuleByIdUseCase();
        const result = await useCase.execute({ tenantId, id });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
