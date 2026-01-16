import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { updateDirectPermissionSchema } from '@/http/schemas/rbac.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-update-direct-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateDirectPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/rbac/users/direct-permissions/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_PERMISSIONS.MANAGE,
        resource: 'user-permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'Update direct permission',
      params: z.object({
        id: idSchema,
      }),
      body: updateDirectPermissionSchema,
      response: {
        200: z.object({
          success: z.boolean(),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { effect, conditions, expiresAt } = request.body;
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

        const updateDirectPermissionUseCase =
          makeUpdateDirectPermissionUseCase();

        await updateDirectPermissionUseCase.execute({
          id,
          effect,
          conditions,
          expiresAt,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.DIRECT_PERMISSION_UPDATE,
          entityId: id,
          placeholders: { adminName, permissionCode: id, userName: 'usuário' },
          newData: { effect, conditions, expiresAt },
        });

        return reply.status(200).send({ success: true });
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
