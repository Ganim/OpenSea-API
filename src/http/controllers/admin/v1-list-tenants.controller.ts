import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListAllTenantsUseCase } from '@/use-cases/admin/tenants/factories/make-list-all-tenants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTenantsAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'List all tenants (super admin)',
      description:
        'Lists all tenants in the system with pagination. Requires super admin privileges.',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(20)
          .optional(),
      }),
      response: {
        200: z.object({
          tenants: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              logoUrl: z.string().nullable(),
              status: z.string(),
              settings: z.record(z.string(), z.unknown()),
              createdAt: z.coerce.date(),
              updatedAt: z.coerce.date(),
            }),
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            perPage: z.number(),
            totalPages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const page = request.query.page ?? 1;
      const perPage = request.query.limit ?? 20;

      const listAllTenantsUseCase = makeListAllTenantsUseCase();
      const { tenants, meta } = await listAllTenantsUseCase.execute({
        page,
        perPage,
      });

      return reply.status(200).send({
        tenants,
        meta,
      });
    },
  });
}
