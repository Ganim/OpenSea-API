import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUnlinkAuthMethodUseCase } from '@/use-cases/core/auth/factories/make-unlink-auth-method-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  userId: z.uuid(),
  linkId: z.uuid(),
});

export async function adminUnlinkAuthMethodController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/users/:userId/auth-links/:linkId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.USERS.ADMIN,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Unlink an authentication method from a user (admin)',
      security: [{ bearerAuth: [] }],
      params: paramsSchema,
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { userId, linkId } = request.params;

      try {
        const useCase = makeUnlinkAuthMethodUseCase();
        await useCase.execute({
          authLinkId: new UniqueEntityID(linkId),
          userId: new UniqueEntityID(userId),
          isAdmin: true,
        });

        return reply
          .status(200)
          .send({ message: 'Método de autenticação removido com sucesso.' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
