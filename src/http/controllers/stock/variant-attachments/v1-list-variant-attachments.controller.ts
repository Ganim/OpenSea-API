import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { attachmentResponseSchema } from '@/http/schemas';
import { makeListVariantAttachmentsUseCase } from '@/use-cases/stock/variant-attachments/factories/make-list-variant-attachments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVariantAttachmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variants/:variantId/attachments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANT_ATTACHMENTS.READ,
        resource: 'variant-attachments',
      }),
    ],
    schema: {
      tags: ['Stock - Variant Attachments'],
      summary: 'List attachments for a variant',
      params: z.object({
        variantId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          variantAttachments: z.array(attachmentResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { variantId } = request.params;

      const useCase = makeListVariantAttachmentsUseCase();
      const { variantAttachments } = await useCase.execute({
        variantId,
        tenantId,
      });

      return reply.status(200).send({ variantAttachments });
    },
  });
}
