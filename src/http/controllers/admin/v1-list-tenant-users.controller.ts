import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListTenantUsersUseCase } from '@/use-cases/admin/tenants/factories/make-list-tenant-users-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTenantUsersAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants/:id/users',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'List tenant users (super admin)',
      description:
        'Lists all users associated with a specific tenant. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          tenantUsers: z.array(
            z.object({
              id: z.string(),
              tenantId: z.string(),
              userId: z.string(),
              role: z.string(),
              joinedAt: z.coerce.date(),
              createdAt: z.coerce.date(),
              updatedAt: z.coerce.date(),
            }),
          ),
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
        const listTenantUsersUseCase = makeListTenantUsersUseCase();
        const { tenantUsers } = await listTenantUsersUseCase.execute({
          tenantId: id,
        });

        return reply.status(200).send({ tenantUsers });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
