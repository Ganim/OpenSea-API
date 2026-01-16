import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { productResponseSchema, updateProductSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import { makeUpdateProductUseCase } from '@/use-cases/stock/products/factories/make-update-product-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateProductController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/products/:productId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.UPDATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Update a product',
      params: z.object({
        productId: z.uuid(),
      }),
      body: updateProductSchema,
      response: {
        200: z.object({
          product: productResponseSchema,
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
      const { productId } = request.params;
      const {
        name,
        description,
        status,
        attributes,
        supplierId,
        manufacturerId,
      } = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getProductByIdUseCase = makeGetProductByIdUseCase();

        const [{ user }, { product: oldProduct }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getProductByIdUseCase.execute({ id: productId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updateProductUseCase = makeUpdateProductUseCase();
        const { product } = await updateProductUseCase.execute({
          id: productId,
          name,
          description,
          status,
          attributes,
          supplierId,
          manufacturerId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.PRODUCT_UPDATE,
          entityId: product.id.toString(),
          placeholders: { userName, productName: product.name },
          oldData: { name: oldProduct.name, status: oldProduct.status },
          newData: { name, description, status, supplierId, manufacturerId },
        });

        return reply.status(200).send({ product: productToDTO(product) });
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
