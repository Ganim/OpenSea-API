import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import {
  createPermissionGroupSchema,
  permissionGroupSchema,
} from '@/http/schemas/rbac.schema';
import { makeCreatePermissionGroupUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPermissionGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/permission-groups',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.GROUPS.CREATE,
        resource: 'permission-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Create a new permission group',
      body: createPermissionGroupSchema,
      response: {
        201: z.object({
          group: permissionGroupSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { name, description, color, priority, parentId } = request.body;

      try {
        const createPermissionGroupUseCase = makeCreatePermissionGroupUseCase();

        // Gerar slug a partir do nome
        const slug = name.toLowerCase().replace(/\s+/g, '-');

        const { group } = await createPermissionGroupUseCase.execute({
          name,
          slug,
          description: description ?? null,
          color: color ?? null,
          priority: priority ?? 100,
          parentId: parentId ?? null,
        });

        return reply
          .status(201)
          .send({ group: PermissionGroupPresenter.toHTTP(group) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
