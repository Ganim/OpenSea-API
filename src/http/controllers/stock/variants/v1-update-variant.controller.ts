import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { updateVariantSchema, variantResponseSchema } from '@/http/schemas';
import { variantToDTO } from '@/mappers/stock/variant/variant-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetVariantByIdUseCase } from '@/use-cases/stock/variants/factories/make-get-variant-by-id-use-case';
import { makeUpdateVariantUseCase } from '@/use-cases/stock/variants/factories/make-update-variant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateVariantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/variants/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.UPDATE,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'Update a variant',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateVariantSchema,
      response: {
        200: z.object({
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
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const {
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
        const getVariantByIdUseCase = makeGetVariantByIdUseCase();

        const [{ user }, oldVariant] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getVariantByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updateVariantUseCase = makeUpdateVariantUseCase();
        const variant = await updateVariantUseCase.execute({
          tenantId,
          id,
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
          message: AUDIT_MESSAGES.STOCK.VARIANT_UPDATE,
          entityId: variant.id.toString(),
          placeholders: { userName, variantName: variant.name },
          oldData: { name: oldVariant.name, sku: oldVariant.sku },
          newData: { sku, name, price },
        });

        return reply.status(200).send({ variant: variantToDTO(variant) });
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
