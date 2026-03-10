import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { attachmentResponseSchema } from '@/http/schemas';
import { makeListProductAttachmentsUseCase } from '@/use-cases/stock/product-attachments/factories/make-list-product-attachments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listProductAttachmentsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:productId/attachments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCT_ATTACHMENTS.READ,
        resource: 'product-attachments',
      }),
    ],
    schema: {
      tags: ['Stock - Product Attachments'],
      summary: 'List attachments for a product',
      params: z.object({
        productId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          productAttachments: z.array(
            attachmentResponseSchema,
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productId } = request.params;

      const useCase = makeListProductAttachmentsUseCase();
      const { productAttachments } = await useCase.execute({
        productId,
        tenantId,
      });

      return reply.status(200).send({ productAttachments });
    },
  });
}
