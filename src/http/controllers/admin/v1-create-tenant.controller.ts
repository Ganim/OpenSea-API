import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeCreateTenantAdminUseCase } from '@/use-cases/admin/tenants/factories/make-create-tenant-admin-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createTenantAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/tenants',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Create a new tenant (super admin)',
      description:
        'Creates a new tenant with the specified configuration. Requires super admin privileges.',
      body: z.object({
        name: z.string().min(1).max(128),
        slug: z.string().min(1).max(128).optional(),
        logoUrl: z.string().url().nullable().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
      }),
      response: {
        201: z.object({
          tenant: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            logoUrl: z.string().nullable(),
            status: z.string(),
            settings: z.record(z.string(), z.unknown()),
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
      const { name, slug, logoUrl, status } = request.body;

      try {
        const useCase = makeCreateTenantAdminUseCase();
        const { tenant } = await useCase.execute({
          name,
          slug,
          logoUrl,
          status,
        });

        return reply.status(201).send({ tenant });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
