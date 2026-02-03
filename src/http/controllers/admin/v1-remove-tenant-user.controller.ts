import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeRemoveUserFromTenantUseCase } from '@/use-cases/core/tenants/factories/make-remove-user-from-tenant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removeTenantUserAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/admin/tenants/:id/users/:userId',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Remove a user from a tenant (super admin)',
      description:
        'Removes a user from the specified tenant. Cannot remove the tenant owner. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('User removed successfully'),
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
      const { id, userId } = request.params;

      try {
        const useCase = makeRemoveUserFromTenantUseCase();
        await useCase.execute({
          tenantId: id,
          userId,
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
