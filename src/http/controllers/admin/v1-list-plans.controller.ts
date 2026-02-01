import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListPlansUseCase } from '@/use-cases/admin/plans/factories/make-list-plans-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPlansAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/plans',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Plans'],
      summary: 'List all plans (super admin)',
      description:
        'Lists all subscription plans in the system. Requires super admin privileges.',
      response: {
        200: z.object({
          plans: z.array(
            z.object({
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
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const listPlansUseCase = makeListPlansUseCase();
      const { plans } = await listPlansUseCase.execute();

      return reply.status(200).send({ plans });
    },
  });
}
