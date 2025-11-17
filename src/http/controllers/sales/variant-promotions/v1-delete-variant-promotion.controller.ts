import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { variantPromotionResponseSchema } from '@/http/schemas/sales.schema';
import { makeDeleteVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-delete-variant-promotion-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteVariantPromotionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/variant-promotions/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Variant Promotions'],
      summary: 'Delete a variant promotion (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ promotion: variantPromotionResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeDeleteVariantPromotionUseCase();
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
