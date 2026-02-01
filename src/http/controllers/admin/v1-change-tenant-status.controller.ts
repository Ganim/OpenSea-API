import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeChangeTenantStatusUseCase } from '@/use-cases/admin/tenants/factories/make-change-tenant-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeTenantStatusAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/tenants/:id/status',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Change tenant status (super admin)',
      description:
        'Changes the status of a tenant (ACTIVE, INACTIVE, or SUSPENDED). Suspended tenants cannot be accessed by their members. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
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
      const { status } = request.body;

      try {
        const changeTenantStatusUseCase = makeChangeTenantStatusUseCase();
        const { tenant } = await changeTenantStatusUseCase.execute({
          tenantId: id,
          status,
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
