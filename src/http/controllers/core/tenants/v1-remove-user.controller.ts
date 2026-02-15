import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRemoveUserFromTenantUseCase } from '@/use-cases/core/tenants/factories/make-remove-user-from-tenant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removeUserFromTenantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tenants/:id/users/:userId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Core - Tenants'],
      summary: 'Remove a user from the tenant',
      description:
        'Removes a user from the tenant. The user will no longer have access to tenant resources. Requires an active tenant context.',
      params: z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
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
      const { id: tenantId, userId } = request.params;

      try {
        const removeUserFromTenantUseCase = makeRemoveUserFromTenantUseCase();
        await removeUserFromTenantUseCase.execute({
          tenantId,
          userId,
        });

        return reply.status(204).send(null);
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
