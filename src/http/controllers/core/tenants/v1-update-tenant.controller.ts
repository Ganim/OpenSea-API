import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateTenantUseCase } from '@/use-cases/core/tenants/factories/make-update-tenant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateTenantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/tenants/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Core - Tenants'],
      summary: 'Update tenant information',
      description:
        'Updates the name, logo, or settings of a tenant. Requires an active tenant context.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        name: z.string().min(2).max(100).optional(),
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
            settings: z.record(z.string(), z.unknown()).nullable(),
            updatedAt: z.coerce.date().nullable(),
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
      const { name, logoUrl, settings } = request.body;

      try {
        const updateTenantUseCase = makeUpdateTenantUseCase();
        const { tenant } = await updateTenantUseCase.execute({
          tenantId: id,
          name,
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
