import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteProductAttachmentUseCase } from '@/use-cases/stock/product-attachments/factories/make-delete-product-attachment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteProductAttachmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/products/:productId/attachments/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCT_ATTACHMENTS.DELETE,
        resource: 'product-attachments',
      }),
    ],
    schema: {
      tags: ['Stock - Product Attachments'],
      summary: 'Remove an attachment from a product',
      params: z.object({
        productId: z.string().uuid(),
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeDeleteProductAttachmentUseCase();
      await useCase.execute({ id, tenantId });

      return reply.status(204).send(null);
    },
  });
}
