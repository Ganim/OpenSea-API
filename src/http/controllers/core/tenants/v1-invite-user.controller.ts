import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeInviteUserToTenantUseCase } from '@/use-cases/core/tenants/factories/make-invite-user-to-tenant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function inviteUserToTenantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tenants/:id/users',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Core - Tenants'],
      summary: 'Invite a user to the tenant',
      description:
        'Adds a user to the tenant with the specified role. Requires an active tenant context.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        userId: z.string().uuid(),
        role: z.string().default('MEMBER').optional(),
      }),
      response: {
        201: z.object({
          tenantUser: z.object({
            id: z.string(),
            tenantId: z.string(),
            userId: z.string(),
            role: z.string(),
            joinedAt: z.coerce.date(),
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
      const { id: tenantId } = request.params;
      const { userId, role } = request.body;

      try {
        const inviteUserToTenantUseCase = makeInviteUserToTenantUseCase();
        const { tenantUser } = await inviteUserToTenantUseCase.execute({
          tenantId,
          userId,
          role,
        });

        return reply.status(201).send({ tenantUser });
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
