import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { bulkAddPermissionsToGroupSchema } from '@/http/schemas/rbac.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeBulkAddPermissionsToGroupUseCase,
  makeGetPermissionGroupByIdUseCase,
} from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function bulkAddPermissionsToGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/permission-groups/:groupId/permissions/bulk',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.ASSOCIATIONS.MANAGE,
        resource: 'associations',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Bulk add permissions to group',
      description:
        'Add multiple permissions to a group in a single request. More efficient than adding one at a time.',
      params: z.object({
        groupId: idSchema,
      }),
      body: bulkAddPermissionsToGroupSchema,
      response: {
        201: z.object({
          success: z.boolean(),
          added: z.number(),
          skipped: z.number(),
          errors: z.array(
            z.object({
              code: z.string(),
              reason: z.string(),
            }),
          ),
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
      const { groupId } = request.params;
      const { permissions } = request.body;
      const adminId = request.user.sub;

      try {
        // Busca dados para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const [{ user: admin }, { group }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getPermissionGroupByIdUseCase.execute({ id: groupId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const bulkAddPermissionsToGroupUseCase =
          makeBulkAddPermissionsToGroupUseCase();
        const result = await bulkAddPermissionsToGroupUseCase.execute({
          groupId,
          permissions: permissions.map((p) => ({
            permissionCode: p.permissionCode,
            effect: p.effect ?? 'allow',
            conditions: p.conditions ?? null,
          })),
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.PERMISSION_BULK_ADD_TO_GROUP,
          entityId: groupId,
          placeholders: {
            adminName,
            groupName: group.name,
            count: result.added.toString(),
          },
          newData: {
            groupId,
            permissionsCount: permissions.length,
            added: result.added,
            skipped: result.skipped,
            errorsCount: result.errors.length,
          },
        });

        return reply.status(201).send({
          success: true,
          added: result.added,
          skipped: result.skipped,
          errors: result.errors,
        });
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
