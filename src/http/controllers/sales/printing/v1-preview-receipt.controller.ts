import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  previewReceiptParamsSchema,
  previewReceiptResponseSchema,
} from '@/http/schemas/sales/printing/print-job.schema';
import { makePreviewReceiptUseCase } from '@/use-cases/sales/printing/factories/make-preview-receipt-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1PreviewReceiptController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/orders/:orderId/print/preview',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ACCESS,
        resource: 'sales-printing',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Preview ESC/POS receipt payload',
      params: previewReceiptParamsSchema,
      response: {
        200: previewReceiptResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makePreviewReceiptUseCase();

        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          orderId: request.params.orderId,
        });

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
