import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListUserTenantsUseCase } from '@/use-cases/core/tenants/factories/make-list-user-tenants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUserTenantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/auth/tenants',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Tenants'],
      summary: 'List tenants for the authenticated user',
      description:
        'Returns all tenants the authenticated user is a member of. Used after login to allow the user to select which tenant to operate in.',
      response: {
        200: z.object({
          tenants: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              logoUrl: z.string().nullable(),
              status: z.string(),
              role: z.string(),
              joinedAt: z.coerce.date(),
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
      const userId = request.user.sub;

      try {
        const listUserTenantsUseCase = makeListUserTenantsUseCase();
        const { tenants } = await listUserTenantsUseCase.execute({ userId });

        return reply.status(200).send({ tenants });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
