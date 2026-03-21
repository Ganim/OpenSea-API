import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeUpsertSkillPricingUseCase } from '@/use-cases/admin/catalog/factories/make-upsert-skill-pricing';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentSkillPricing } from './presenters';

export async function v1UpsertSkillPricingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/catalog/pricing/:skillCode',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Catalog'],
      summary: 'Upsert skill pricing (super admin)',
      description:
        'Creates or updates pricing for a specific skill code. Validates pricing type constraints.',
      params: z.object({
        skillCode: z.string(),
      }),
      body: z.object({
        pricingType: z.enum(['FLAT', 'PER_UNIT', 'USAGE']),
        flatPrice: z.number().min(0).optional(),
        unitPrice: z.number().min(0).optional(),
        unitMetric: z.string().optional(),
        unitMetricLabel: z.string().optional(),
        usageIncluded: z.number().int().min(0).optional(),
        usagePrice: z.number().min(0).optional(),
        usageMetric: z.string().optional(),
        usageMetricLabel: z.string().optional(),
        annualDiscount: z.number().min(0).max(100).optional(),
      }),
      response: {
        200: z.object({
          pricing: z.record(z.string(), z.unknown()),
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
      const { skillCode } = request.params;
      const {
        pricingType,
        flatPrice,
        unitPrice,
        unitMetric,
        unitMetricLabel,
        usageIncluded,
        usagePrice,
        usageMetric,
        usageMetricLabel,
        annualDiscount,
      } = request.body;

      try {
        const upsertSkillPricingUseCase = makeUpsertSkillPricingUseCase();
        const { pricing } = await upsertSkillPricingUseCase.execute({
          skillCode,
          pricingType,
          flatPrice,
          unitPrice,
          unitMetric,
          unitMetricLabel,
          usageIncluded,
          usagePrice,
          usageMetric,
          usageMetricLabel,
          annualDiscount,
        });

        return reply.status(200).send({
          pricing: presentSkillPricing(pricing),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
