import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { variantResponseSchema } from '@/http/schemas';
import { makeGetVariantByIdUseCase } from '@/use-cases/stock/variants/factories/make-get-variant-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getVariantByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variants/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Variants'],
      summary: 'Get variant by ID',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: z.object({
          variant: variantResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getVariantByIdUseCase = makeGetVariantByIdUseCase();
        const { variant } = await getVariantByIdUseCase.execute({ id });

        return reply.status(200).send({ variant });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
