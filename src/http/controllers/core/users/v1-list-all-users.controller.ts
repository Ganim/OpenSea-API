import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListAllUsersUseCase } from '@/use-cases/core/users/factories/make-list-all-users-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listAllUsersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/users',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.LIST,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'List all users',
      response: {
        200: z.object({
          users: z.array(
            z.object({
              id: z.string(),
              email: z.string(),
              username: z.string(),
              lastLoginAt: z.coerce.date().nullable(),
              deletedAt: z.coerce.date().nullable().optional(),
              profile: z
                .object({
                  id: z.string(),
                  userId: z.string(),
                  name: z.string(),
                  surname: z.string(),
                  birthday: z.coerce.date().optional(),
                  location: z.string(),
                  bio: z.string(),
                  avatarUrl: z.string(),
                  createdAt: z.coerce.date(),
                  updatedAt: z.coerce.date().optional(),
                })
                .nullable()
                .optional(),
            }),
          ),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (_, reply) => {
      try {
        const listAllUsersUseCase = makeListAllUsersUseCase();
        const { users } = await listAllUsersUseCase.execute();
        return reply.status(200).send({ users });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
