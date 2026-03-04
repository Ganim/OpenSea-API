import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  setFolderAccessSchema,
  folderAccessRuleResponseSchema,
} from '@/http/schemas/storage';
import { folderAccessRuleToDTO } from '@/mappers/storage';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { checkInlinePermission } from '@/http/helpers/check-inline-permission';
import { makeSetFolderAccessUseCase } from '@/use-cases/storage/access/factories/make-set-folder-access-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function setFolderAccessController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/folders/:id/access',
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
      summary: 'Set access rules for a folder',
      description:
        'Grant or update access permissions for a user or group on a folder. Provide either userId or groupId, not both.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: setFolderAccessSchema,
      response: {
        201: z.object({
          rule: folderAccessRuleResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
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
      const { id: folderId } = request.params;
      const {
        userId,
        groupId,
        teamId,
        canRead,
        canWrite,
        canDelete,
        canShare,
      } = request.body as {
        userId?: string;
        groupId?: string;
        teamId?: string;
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        canShare: boolean;
      };

      try {
        // Determine the required share permission based on folder type and target
        const foldersRepo = new PrismaStorageFoldersRepository();
        const folder = await foldersRepo.findById(
          new UniqueEntityID(folderId),
          tenantId,
        );

        if (!folder) {
          throw new ResourceNotFoundError('Folder');
        }

        const requiredPermission = resolveSharePermission(
          folder.isSystem,
          folder.isFilter,
          !!groupId || !!teamId,
        );

        await checkInlinePermission(request, requiredPermission);

        const setFolderAccessUseCase = makeSetFolderAccessUseCase();
        const { rule } = await setFolderAccessUseCase.execute({
          tenantId,
          folderId,
          userId,
          groupId,
          teamId,
          canRead,
          canWrite,
          canDelete,
          canShare,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.ACCESS_GRANT,
          entityId: rule.ruleId.toString(),
          placeholders: {
            userName: request.user.sub,
            folderName: folderId,
          },
          newData: {
            userId,
            groupId,
            teamId,
            canRead,
            canWrite,
            canDelete,
            canShare,
          },
        });

        return reply.status(201).send({ rule: folderAccessRuleToDTO(rule) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
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
