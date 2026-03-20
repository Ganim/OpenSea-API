import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeValidateBulkProductsUseCase } from '@/use-cases/stock/products/factories/make-validate-bulk-products-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const validateBulkProductsSchema = z.object({
  productNames: z.array(z.string()).default([]),
  categoryNames: z.array(z.string()).default([]),
  manufacturerNames: z.array(z.string()).default([]),
  templateId: z.string().uuid(),
});

const entityRefSchema = z.object({
  name: z.string(),
  id: z.string(),
});

export async function validateBulkProductsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products/bulk/validate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.REGISTER,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Validate products for bulk import',
      body: validateBulkProductsSchema,
      response: {
        200: z.object({
          duplicateProducts: z.array(entityRefSchema),
          existingCategories: z.array(entityRefSchema),
          missingCategories: z.array(z.string()),
          existingManufacturers: z.array(entityRefSchema),
          missingManufacturers: z.array(z.string()),
          templateValid: z.boolean(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productNames, categoryNames, manufacturerNames, templateId } =
        request.body;

      const validateBulkProductsUseCase = makeValidateBulkProductsUseCase();
      const validationResult = await validateBulkProductsUseCase.execute({
        tenantId,
        productNames,
        categoryNames,
        manufacturerNames,
        templateId,
      });

      return reply.status(200).send(validationResult);
    },
  });
}
