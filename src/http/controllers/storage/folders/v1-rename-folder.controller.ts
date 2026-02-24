import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  renameStorageFolderSchema,
  storageFolderResponseSchema,
} from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeGetFolderUseCase } from '@/use-cases/storage/folders/factories/make-get-folder-use-case';
import { makeRenameFolderUseCase } from '@/use-cases/storage/folders/factories/make-rename-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function renameFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/storage/folders/:id/rename',
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
      summary: 'Rename a folder',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: renameStorageFolderSchema,
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
      const { name } = request.body;

      try {
        const getFolderUseCase = makeGetFolderUseCase();
        const { folder: oldFolder } = await getFolderUseCase.execute({
          tenantId,
          folderId: id,
        });

        const renameFolderUseCase = makeRenameFolderUseCase();
        const { folder } = await renameFolderUseCase.execute({
          tenantId,
          folderId: id,
          name,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FOLDER_RENAME,
          entityId: folder.folderId.toString(),
          placeholders: {
            userName: request.user.sub,
            oldName: oldFolder.name,
            newName: folder.name,
          },
          oldData: { name: oldFolder.name },
          newData: { name: folder.name },
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
