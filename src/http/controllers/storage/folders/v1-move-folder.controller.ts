import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  moveStorageFolderSchema,
  storageFolderResponseSchema,
} from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeMoveFolderUseCase } from '@/use-cases/storage/folders/factories/make-move-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function moveFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/storage/folders/:id/move',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.USER_FOLDERS.UPDATE,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Move a folder to a different parent',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: moveStorageFolderSchema,
      response: {
        200: z.object({
          folder: storageFolderResponseSchema,
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
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { parentId } = request.body;

      try {
        const moveFolderUseCase = makeMoveFolderUseCase();
        const { folder } = await moveFolderUseCase.execute({
          tenantId,
          folderId: id,
          targetParentId: parentId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FOLDER_MOVE,
          entityId: folder.folderId.toString(),
          placeholders: {
            userName: request.user.sub,
            folderName: folder.name,
            targetPath: folder.path,
          },
          newData: { parentId, path: folder.path },
        });

        return reply.status(200).send({ folder: storageFolderToDTO(folder) });
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
