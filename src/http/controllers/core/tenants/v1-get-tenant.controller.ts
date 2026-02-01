import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetTenantByIdUseCase } from '@/use-cases/core/tenants/factories/make-get-tenant-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getTenantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tenants/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Core - Tenants'],
      summary: 'Get tenant details by ID',
      description:
        'Returns the details of a specific tenant. Requires an active tenant context.',
      params: z.object({
        id: z.string().uuid(),
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
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date().nullable(),
          }),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getTenantByIdUseCase = makeGetTenantByIdUseCase();
        const { tenant } = await getTenantByIdUseCase.execute({
          tenantId: id,
        });

        return reply.status(200).send({ tenant });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
