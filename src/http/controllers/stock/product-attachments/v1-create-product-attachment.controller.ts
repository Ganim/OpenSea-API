import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createAttachmentBodySchema,
  attachmentResponseSchema,
} from '@/http/schemas';
import { makeCreateProductAttachmentUseCase } from '@/use-cases/stock/product-attachments/factories/make-create-product-attachment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductAttachmentController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products/:productId/attachments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCT_ATTACHMENTS.CREATE,
        resource: 'product-attachments',
      }),
    ],
    schema: {
      tags: ['Stock - Product Attachments'],
      summary: 'Add an attachment to a product',
      params: z.object({
        productId: z.string().uuid(),
      }),
      body: createAttachmentBodySchema,
      response: {
        201: z.object({
          productAttachment: attachmentResponseSchema,
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
      const { fileUrl, fileName, fileSize, mimeType, label, order } = request.body;

      try {
        const useCase = makeCreateProductAttachmentUseCase();
        const { productAttachment } = await useCase.execute({
          productId,
          tenantId,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          label,
          order,
        });

        return reply.status(201).send({ productAttachment });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
