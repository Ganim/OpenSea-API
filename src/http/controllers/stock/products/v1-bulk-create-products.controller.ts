import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPlanLimitsMiddleware } from '@/http/middlewares/tenant/verify-plan-limits';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeBulkCreateProductsUseCase } from '@/use-cases/stock/products/factories/make-bulk-create-products-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const bulkCreateProductsSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        status: z.string().optional(),
        templateId: z.string().uuid(),
        manufacturerId: z.string().uuid().optional(),
        supplierId: z.string().uuid().optional(),
        categoryIds: z.array(z.string().uuid()).optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(100),
  options: z
    .object({
      skipDuplicates: z.boolean().default(false),
    })
    .default({ skipDuplicates: false }),
});

export async function bulkCreateProductsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products/bulk',
    bodyLimit: 5 * 1024 * 1024,
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPlanLimitsMiddleware('products'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.CREATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Bulk create products',
      body: bulkCreateProductsSchema,
      response: {
        201: z.object({
          created: z.array(z.unknown()),
          skipped: z.array(
            z.object({
              name: z.string(),
              reason: z.string(),
            }),
          ),
          errors: z.array(
            z.object({
              index: z.number(),
              name: z.string(),
              message: z.string(),
            }),
          ),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { products, options } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const bulkCreateProductsUseCase = makeBulkCreateProductsUseCase();
      const bulkResult = await bulkCreateProductsUseCase.execute({
        tenantId,
        products,
        options,
      });

      for (const createdProduct of bulkResult.created) {
        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.PRODUCT_CREATE,
          entityId: createdProduct.id.toString(),
          placeholders: {
            userName,
            productName: createdProduct.name,
            sku: createdProduct.fullCode || 'N/A',
          },
        });
      }

      const mappedProducts = bulkResult.created.map(productToDTO);

      return reply.status(201).send({
        created: mappedProducts,
        skipped: bulkResult.skipped,
        errors: bulkResult.errors,
      });
    },
  });
}
