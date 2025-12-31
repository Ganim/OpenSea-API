import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { variantPromotionResponseSchema } from '@/http/schemas/sales.schema';
import { makeGetVariantPromotionByIdUseCase } from '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getVariantPromotionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variant-promotions/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Variant Promotions'],
      summary: 'Get variant promotion by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ promotion: variantPromotionResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeGetVariantPromotionByIdUseCase();
        const { promotion } = await useCase.execute({ id });
        return reply.status(200).send({ promotion });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
