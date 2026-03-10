import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productCareInstructionResponseSchema } from '@/http/schemas';
import { makeListProductCareInstructionsUseCase } from '@/use-cases/stock/product-care-instructions/factories/make-list-product-care-instructions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listProductCareInstructionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:productId/care-instructions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCT_CARE_INSTRUCTIONS.READ,
        resource: 'product-care-instructions',
      }),
    ],
    schema: {
      tags: ['Stock - Product Care Instructions'],
      summary: 'List care instructions for a product',
      params: z.object({
        productId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          productCareInstructions: z.array(
            productCareInstructionResponseSchema,
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productId } = request.params;

      const useCase = makeListProductCareInstructionsUseCase();
      const { productCareInstructions } = await useCase.execute({
        productId,
        tenantId,
      });

      return reply.status(200).send({ productCareInstructions });
    },
  });
}
