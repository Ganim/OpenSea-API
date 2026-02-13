import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  careOptionResponseSchema,
  setProductCareInstructionsSchema,
} from '@/http/schemas/stock.schema';
import { getCareCatalogProvider } from '@/services/care';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import { makeSetProductCareInstructionsUseCase } from '@/use-cases/stock/products/factories/make-set-product-care-instructions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function setProductCareController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/products/:productId/care',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.UPDATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Set care instructions for a product',
      description:
        'Updates the care instruction labels for a specific product. Accepts an array of care instruction IDs from the catalog.',
      params: z.object({
        productId: z.string().uuid(),
      }),
      body: setProductCareInstructionsSchema,
      response: {
        200: z.object({
          careInstructionIds: z.array(z.string()),
          careInstructions: z.array(careOptionResponseSchema),
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
      const { productId } = request.params;
      const { careInstructionIds } = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getProductByIdUseCase = makeGetProductByIdUseCase();

        const [{ user }, { product: existingProduct }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getProductByIdUseCase.execute({ tenantId, id: productId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const setProductCareInstructions =
          makeSetProductCareInstructionsUseCase();

        const { product } = await setProductCareInstructions.execute({
          tenantId,
          productId,
          careInstructionIds,
        });

        // Get full care instruction details for response
        const careCatalogProvider = getCareCatalogProvider();
        const careInstructions = careCatalogProvider.getOptionsByIds(
          product.careInstructionIds,
        );

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.PRODUCT_CARE_SET,
          entityId: productId,
          placeholders: { userName, productName: existingProduct.name },
          oldData: {
            name: existingProduct.name,
            careInstructionIds: existingProduct.careInstructionIds,
          },
          newData: {
            name: existingProduct.name,
            careInstructionIds,
          },
        });

        return reply.status(200).send({
          careInstructionIds: product.careInstructionIds,
          careInstructions,
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
