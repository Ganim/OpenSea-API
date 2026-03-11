import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createAttachmentBodySchema,
  attachmentResponseSchema,
} from '@/http/schemas';
import { makeCreateVariantAttachmentUseCase } from '@/use-cases/stock/variant-attachments/factories/make-create-variant-attachment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createVariantAttachmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variants/:variantId/attachments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANT_ATTACHMENTS.CREATE,
        resource: 'variant-attachments',
      }),
    ],
    schema: {
      tags: ['Stock - Variant Attachments'],
      summary: 'Add an attachment to a variant',
      params: z.object({
        variantId: z.string().uuid(),
      }),
      body: createAttachmentBodySchema,
      response: {
        201: z.object({
          variantAttachment: attachmentResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { variantId } = request.params;
      const { fileUrl, fileName, fileSize, mimeType, label, order } =
        request.body;

      const useCase = makeCreateVariantAttachmentUseCase();
      const { variantAttachment } = await useCase.execute({
        variantId,
        tenantId,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        label,
        order,
      });

      return reply.status(201).send({ variantAttachment });
    },
  });
}
