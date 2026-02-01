import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeUpdatePlanUseCase } from '@/use-cases/admin/plans/factories/make-update-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePlanAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/plans/:id',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Plans'],
      summary: 'Update a plan (super admin)',
      description:
        'Updates an existing subscription plan configuration. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        name: z.string().min(1).max(100).optional(),
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
        200: z.object({
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
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
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
        const updatePlanUseCase = makeUpdatePlanUseCase();
        const { plan } = await updatePlanUseCase.execute({
          planId: id,
          name,
          tier,
          description,
          price,
          isActive,
          maxUsers,
          maxWarehouses,
          maxProducts,
        });

        return reply.status(200).send({ plan });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
