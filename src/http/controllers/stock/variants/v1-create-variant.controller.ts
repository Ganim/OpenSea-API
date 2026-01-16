import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { createVariantSchema, variantResponseSchema } from '@/http/schemas';
import { variantToDTO } from '@/mappers/stock/variant/variant-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import { makeCreateVariantUseCase } from '@/use-cases/stock/variants/factories/make-create-variant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createVariantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variants',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.CREATE,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'Create a new variant',
      body: createVariantSchema,
      response: {
        201: z.object({
          variant: variantResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        productId,
        sku,
        name,
        price,
        imageUrl,
        attributes,
        costPrice,
        profitMargin,
        barcode,
        qrCode,
        eanCode,
        upcCode,
        colorHex,
        colorPantone,
        minStock,
        maxStock,
        reorderPoint,
        reorderQuantity,
        reference,
        similars,
        outOfLine,
        isActive,
      } = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getProductByIdUseCase = makeGetProductByIdUseCase();

        const [{ user }, { product }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getProductByIdUseCase.execute({ id: productId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createVariantUseCase = makeCreateVariantUseCase();
        const variant = await createVariantUseCase.execute({
          productId,
          sku,
          name,
          price,
          imageUrl,
          attributes,
          costPrice,
          profitMargin,
          barcode,
          qrCode,
          eanCode,
          upcCode,
          colorHex,
          colorPantone,
          minStock,
          maxStock,
          reorderPoint,
          reorderQuantity,
          reference,
          similars,
          outOfLine,
          isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.VARIANT_CREATE,
          entityId: variant.id.toString(),
          placeholders: {
            userName,
            variantName: variant.name,
            productName: product.name,
          },
          newData: { productId, sku, name, price },
        });

        return reply.status(201).send({ variant: variantToDTO(variant) });
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
