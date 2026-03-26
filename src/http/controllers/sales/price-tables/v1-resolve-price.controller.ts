import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { resolvePriceResponseSchema, resolvePriceSchema } from '@/http/schemas';
import { makeResolvePriceUseCase } from '@/use-cases/sales/price-tables/factories/make-resolve-price-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function resolvePriceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/price-resolver',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.ACCESS,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'Resolve the best price for a variant',
      body: resolvePriceSchema,
      response: {
        200: z.object({
          result: resolvePriceResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { variantId, customerId, quantity, priceTableId } = request.body;

      try {
        const useCase = makeResolvePriceUseCase();
        const resolvedPrice = await useCase.execute({
          tenantId,
          variantId,
          customerId,
          quantity,
          priceTableId,
        });

        return reply.status(200).send({
          result: resolvedPrice,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
