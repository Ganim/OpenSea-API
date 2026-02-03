import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeCreateTenantUserAdminUseCase } from '@/use-cases/admin/tenants/factories/make-create-tenant-user-admin-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createTenantUserAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/tenants/:id/users',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Create a user in a tenant (super admin)',
      description:
        'Creates a new user account and assigns them to the specified tenant. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        username: z.string().min(3).max(32).optional(),
        role: z.string().max(32).optional(),
      }),
      response: {
        201: z.object({
          user: z.object({
            id: z.string(),
            email: z.string(),
            username: z.string(),
            createdAt: z.coerce.date(),
          }),
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
      const { id } = request.params;
      const { email, password, username, role } = request.body;

      try {
        const useCase = makeCreateTenantUserAdminUseCase();
        const { user, tenantUser } = await useCase.execute({
          tenantId: id,
          email,
          password,
          username,
          role,
        });

        return reply.status(201).send({ user, tenantUser });
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
