import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeFindVariantByScanCodeUseCase } from '@/use-cases/sales/orders/factories/make-find-variant-by-scan-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1FindVariantByScanCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/orders/scan/:code',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SELL,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Find variant by scanner code (barcode, EAN, UPC or SKU)',
      params: z.object({
        code: z.string().min(1),
      }),
      response: {
        200: z.object({
          matchedBy: z.enum(['barcode', 'ean', 'upc', 'sku']),
          variant: z.object({
            id: z.string().uuid(),
            name: z.string(),
            sku: z.string().nullable(),
            barcode: z.string().nullable(),
            eanCode: z.string().nullable(),
            upcCode: z.string().nullable(),
            price: z.number(),
            isActive: z.boolean(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { code } = request.params;

      try {
        const useCase = makeFindVariantByScanCodeUseCase();
        const result = await useCase.execute({ tenantId, code });

        return reply.status(200).send({
          matchedBy: result.matchedBy,
          variant: {
            id: result.variant.id.toString(),
            name: result.variant.name,
            sku: result.variant.sku ?? null,
            barcode: result.variant.barcode ?? null,
            eanCode: result.variant.eanCode ?? null,
            upcCode: result.variant.upcCode ?? null,
            price: result.variant.price,
            isActive: result.variant.isActive,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
