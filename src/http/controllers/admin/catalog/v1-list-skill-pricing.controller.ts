import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListSkillPricingUseCase } from '@/use-cases/admin/catalog/factories/make-list-skill-pricing';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentSkillPricing } from './presenters';

export async function v1ListSkillPricingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/catalog/pricing',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Catalog'],
      summary: 'List all skill pricing (super admin)',
      description:
        'Lists all skill pricing entries. Optionally filter by pricing type (FLAT, PER_UNIT, USAGE).',
      querystring: z.object({
        pricingType: z.enum(['FLAT', 'PER_UNIT', 'USAGE']).optional(),
      }),
      response: {
        200: z.object({
          pricing: z.array(z.record(z.string(), z.unknown())),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { pricingType } = request.query;

      const listSkillPricingUseCase = makeListSkillPricingUseCase();
      const { pricing } = await listSkillPricingUseCase.execute({
        pricingType,
      });

      const formattedPricing = pricing.map(presentSkillPricing);

      return reply.status(200).send({ pricing: formattedPricing });
    },
  });
}
