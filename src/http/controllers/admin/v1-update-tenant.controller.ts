import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeUpdateTenantAdminUseCase } from '@/use-cases/admin/tenants/factories/make-update-tenant-admin-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateTenantAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/tenants/:id',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Update a tenant (super admin)',
      description:
        'Updates tenant information. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        name: z.string().min(1).max(128).optional(),
        slug: z.string().min(1).max(128).optional(),
        logoUrl: z.string().url().nullable().optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      }),
      response: {
        200: z.object({
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
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { name, slug, logoUrl, settings } = request.body;

      try {
        const useCase = makeUpdateTenantAdminUseCase();
        const { tenant } = await useCase.execute({
          tenantId: id,
          name,
          slug,
          logoUrl,
          settings,
        });

        return reply.status(200).send({ tenant });
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
