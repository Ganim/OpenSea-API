import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { updateVariantPromotionSchema, variantPromotionResponseSchema } from '@/http/schemas/sales.schema';
import { makeUpdateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-update-variant-promotion-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateVariantPromotionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/variant-promotions/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Variant Promotions'],
      summary: 'Update a variant promotion',
      params: z.object({ id: z.string().uuid() }),
      body: updateVariantPromotionSchema,
      response: {
        200: z.object({ promotion: variantPromotionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeUpdateVariantPromotionUseCase();
        const { promotion } = await useCase.execute({ id, ...request.body });
        return reply.status(200).send({ promotion });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
