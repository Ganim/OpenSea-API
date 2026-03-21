import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createStorageFolderSchema,
  storageFolderResponseSchema,
} from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeCreateFolderUseCase } from '@/use-cases/storage/folders/factories/make-create-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/folders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FOLDERS.REGISTER,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Create a new storage folder',
      body: createStorageFolderSchema,
      response: {
        201: z.object({
          folder: storageFolderResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { name, parentId, icon, color } = request.body;

      try {
        const createFolderUseCase = makeCreateFolderUseCase();
        const { folder } = await createFolderUseCase.execute({
          tenantId,
          name,
          parentId,
          icon,
          color,
          createdBy: request.user.sub,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FOLDER_CREATE,
          entityId: folder.folderId.toString(),
          placeholders: {
            userName: request.user.sub,
            folderName: folder.name,
          },
          newData: { name, parentId },
        });

        return reply.status(201).send({ folder: storageFolderToDTO(folder) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
