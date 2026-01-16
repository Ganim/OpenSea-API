import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import {
  createPermissionGroupSchema,
  permissionGroupSchema,
} from '@/http/schemas/rbac.schema';
import { makeCreatePermissionGroupUseCase } from '@/use-cases/rbac/factories';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
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
      const adminId = request.user.sub;

      try {
        // Busca nome do admin para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: adminId,
        });
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

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

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.PERMISSION_GROUP_CREATE,
          entityId: group.id.toString(),
          placeholders: { adminName, groupName: name },
          newData: { name, description, color, priority, parentId },
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
