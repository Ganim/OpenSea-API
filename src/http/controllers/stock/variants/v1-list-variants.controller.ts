import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { variantResponseSchema } from '@/http/schemas';
import { makeListVariantsUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVariantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variants',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Variants'],
      summary: 'List all variants',
      response: {
        200: z.object({
          variants: z.array(variantResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const listVariantsUseCase = makeListVariantsUseCase();
      const { variants } = await listVariantsUseCase.execute();

      return reply.status(200).send({ variants });
    },
  });
}
