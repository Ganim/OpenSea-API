import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { variantPromotionResponseSchema } from '@/http/schemas/sales.schema';
import { makeListVariantPromotionsUseCase } from '@/use-cases/sales/variant-promotions/factories/make-list-variant-promotions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listVariantPromotionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variant-promotions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Variant Promotions'],
      summary: 'List variant promotions',
      querystring: z.object({
        variantId: z.string().uuid().optional(),
        activeOnly: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({ promotions: z.array(variantPromotionResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const { variantId, activeOnly } = request.query as {
        variantId?: string;
        activeOnly?: boolean;
      };
      const useCase = makeListVariantPromotionsUseCase();
      const { promotions } = await useCase.execute({ variantId, activeOnly });
      return reply.status(200).send({ promotions });
    },
  });
}
