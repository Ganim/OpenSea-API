import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createProductCareInstructionSchema,
  productCareInstructionResponseSchema,
} from '@/http/schemas';
import { makeCreateProductCareInstructionUseCase } from '@/use-cases/stock/product-care-instructions/factories/make-create-product-care-instruction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductCareInstructionController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products/:productId/care-instructions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCT_CARE_INSTRUCTIONS.CREATE,
        resource: 'product-care-instructions',
      }),
    ],
    schema: {
      tags: ['Stock - Product Care Instructions'],
      summary: 'Add a care instruction to a product',
      params: z.object({
        productId: z.string().uuid(),
      }),
      body: createProductCareInstructionSchema,
      response: {
        201: z.object({
          productCareInstruction: productCareInstructionResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productId } = request.params;
      const { careInstructionId, order } = request.body;

      try {
        const useCase = makeCreateProductCareInstructionUseCase();
        const { productCareInstruction } = await useCase.execute({
          productId,
          tenantId,
          careInstructionId,
          order,
        });

        return reply.status(201).send({ productCareInstruction });
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
