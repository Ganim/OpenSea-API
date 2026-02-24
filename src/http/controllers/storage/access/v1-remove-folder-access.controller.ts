import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { checkInlinePermission } from '@/http/helpers/check-inline-permission';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaFolderAccessRulesRepository } from '@/repositories/storage/prisma/prisma-folder-access-rules-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { makeRemoveFolderAccessUseCase } from '@/use-cases/storage/access/factories/make-remove-folder-access-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removeFolderAccessController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/storage/folders/:id/access/:ruleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.INTERFACE.VIEW,
        resource: 'storage-access',
      }),
    ],
    schema: {
      tags: ['Storage - Access'],
      summary: 'Remove an access rule from a folder',
      params: z.object({
        id: z.string().uuid(),
        ruleId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        403: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: folderId, ruleId } = request.params;

      try {
        // Look up the folder and rule to determine the required share permission
        const foldersRepo = new PrismaStorageFoldersRepository();
        const folder = await foldersRepo.findById(
          new UniqueEntityID(folderId),
          tenantId,
        );

        if (!folder) {
          throw new ResourceNotFoundError('Folder');
        }

        const rulesRepo = new PrismaFolderAccessRulesRepository();
        const rule = await rulesRepo.findById(new UniqueEntityID(ruleId));

        if (!rule) {
          throw new ResourceNotFoundError('Access rule');
        }

        const isGroup = !!rule.groupId;
        const requiredPermission = resolveSharePermission(
          folder.isSystem,
          folder.isFilter,
          isGroup,
        );

        await checkInlinePermission(request, requiredPermission);

        const removeFolderAccessUseCase = makeRemoveFolderAccessUseCase();
        await removeFolderAccessUseCase.execute({
          tenantId,
          folderId,
          ruleId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.ACCESS_REVOKE,
          entityId: ruleId,
          placeholders: {
            userName: request.user.sub,
            folderName: folderId,
          },
          oldData: { ruleId, folderId },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}

function resolveSharePermission(
  isSystem: boolean,
  isFilter: boolean,
  isGroup: boolean,
): string {
  if (isSystem) {
    return isGroup
      ? PermissionCodes.STORAGE.SYSTEM_FOLDERS.SHARE_GROUP
      : PermissionCodes.STORAGE.SYSTEM_FOLDERS.SHARE_USER;
  }
  if (isFilter) {
    return isGroup
      ? PermissionCodes.STORAGE.FILTER_FOLDERS.SHARE_GROUP
      : PermissionCodes.STORAGE.FILTER_FOLDERS.SHARE_USER;
  }
  return isGroup
    ? PermissionCodes.STORAGE.USER_FOLDERS.SHARE_GROUP
    : PermissionCodes.STORAGE.USER_FOLDERS.SHARE_USER;
}
