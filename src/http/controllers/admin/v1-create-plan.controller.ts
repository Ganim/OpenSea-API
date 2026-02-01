import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeCreatePlanUseCase } from '@/use-cases/admin/plans/factories/make-create-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPlanAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/plans',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Plans'],
      summary: 'Create a new plan (super admin)',
      description:
        'Creates a new subscription plan with the specified configuration. Plans define resource limits and available modules for tenants. Requires super admin privileges.',
      body: z.object({
        name: z.string().min(1).max(100),
        tier: z
          .enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
          .optional(),
        description: z.string().max(500).nullable().optional(),
        price: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
        maxUsers: z.number().int().positive().optional(),
        maxWarehouses: z.number().int().positive().optional(),
        maxProducts: z.number().int().positive().optional(),
      }),
      response: {
        201: z.object({
          plan: z.object({
            id: z.string(),
            name: z.string(),
            tier: z.string(),
            description: z.string().nullable(),
            price: z.number(),
            isActive: z.boolean(),
            maxUsers: z.number(),
            maxWarehouses: z.number(),
            maxProducts: z.number(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        name,
        tier,
        description,
        price,
        isActive,
        maxUsers,
        maxWarehouses,
        maxProducts,
      } = request.body;

      try {
        const createPlanUseCase = makeCreatePlanUseCase();
        const { plan } = await createPlanUseCase.execute({
          name,
          tier,
          description,
          price,
          isActive,
          maxUsers,
          maxWarehouses,
          maxProducts,
        });

        return reply.status(201).send({ plan });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
