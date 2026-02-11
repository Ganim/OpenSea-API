import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createProductSchema, productResponseSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateProductUseCase } from '@/use-cases/stock/products/factories/make-create-product-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.CREATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Create a new product',
      body: createProductSchema,
      response: {
        201: z.object({
          product: productResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        name,
        description,
        status,
        outOfLine,
        attributes,
        templateId,
        supplierId,
        manufacturerId,
        categoryIds,
        careInstructionIds,
      } = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createProductUseCase = makeCreateProductUseCase();
        const { product } = await createProductUseCase.execute({
          tenantId,
          name,
          description,
          status,
          outOfLine,
          attributes,
          templateId,
          supplierId,
          manufacturerId,
          categoryIds,
          careInstructionIds,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.PRODUCT_CREATE,
          entityId: product.id.toString(),
          placeholders: {
            userName,
            productName: product.name,
            sku: product.fullCode || 'N/A',
          },
          newData: {
            name,
            description,
            status,
            templateId,
            supplierId,
            manufacturerId,
          },
        });

        return reply.status(201).send({ product: productToDTO(product) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
