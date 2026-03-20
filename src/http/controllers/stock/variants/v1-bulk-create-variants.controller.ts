import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { variantToDTO } from '@/mappers/stock/variant/variant-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import { makeBulkCreateVariantsUseCase } from '@/use-cases/stock/variants/factories/make-bulk-create-variants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const bulkCreateVariantsSchema = z.object({
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(256),
        productId: z.string().uuid(),
        sku: z.string().max(100).optional(),
        price: z.number().nonnegative().optional(),
        costPrice: z.number().nonnegative().optional(),
        profitMargin: z.number().min(0).max(100).optional(),
        colorHex: z.string().max(7).optional(),
        colorPantone: z.string().max(50).optional(),
        secondaryColorHex: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        secondaryColorPantone: z.string().max(32).optional(),
        pattern: z
          .enum([
            'SOLID',
            'STRIPED',
            'PLAID',
            'PRINTED',
            'GRADIENT',
            'JACQUARD',
          ])
          .optional(),
        minStock: z.number().int().min(0).optional(),
        maxStock: z.number().int().min(0).optional(),
        reorderPoint: z.number().int().min(0).optional(),
        reorderQuantity: z.number().int().min(0).optional(),
        reference: z.string().max(128).optional(),
        outOfLine: z.boolean().optional(),
        isActive: z.boolean().optional(),
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

export async function bulkCreateVariantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variants/bulk',
    bodyLimit: 5 * 1024 * 1024,
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.REGISTER,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'Bulk create variants',
      body: bulkCreateVariantsSchema,
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
      const { variants, options } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const bulkCreateVariantsUseCase = makeBulkCreateVariantsUseCase();
      const bulkResult = await bulkCreateVariantsUseCase.execute({
        tenantId,
        variants,
        options,
      });

      // Pre-fetch unique products for audit logging
      const uniqueProductIds = [
        ...new Set(bulkResult.created.map((v) => v.productId.toString())),
      ];
      const getProductByIdUseCase = makeGetProductByIdUseCase();
      const productNameMap = new Map<string, string>();
      for (const productId of uniqueProductIds) {
        try {
          const { product } = await getProductByIdUseCase.execute({
            tenantId,
            id: productId,
          });
          productNameMap.set(productId, product.name);
        } catch {
          productNameMap.set(productId, 'Unknown');
        }
      }

      for (const createdVariant of bulkResult.created) {
        const productName =
          productNameMap.get(createdVariant.productId.toString()) ?? 'Unknown';

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.VARIANT_CREATE,
          entityId: createdVariant.id.toString(),
          placeholders: {
            userName,
            variantName: createdVariant.name,
            productName,
          },
        });
      }

      const mappedVariants = bulkResult.created.map(variantToDTO);

      return reply.status(201).send({
        created: mappedVariants,
        skipped: bulkResult.skipped,
        errors: bulkResult.errors,
      });
    },
  });
}
