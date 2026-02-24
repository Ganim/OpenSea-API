import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetFolderUseCase } from '@/use-cases/storage/folders/factories/make-get-folder-use-case';
import { makeDeleteFolderUseCase } from '@/use-cases/storage/folders/factories/make-delete-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/storage/folders/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.USER_FOLDERS.DELETE,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Delete a folder and all its contents',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
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

      try {
        const getFolderUseCase = makeGetFolderUseCase();
        const { folder } = await getFolderUseCase.execute({
          tenantId,
          folderId: id,
        });

        const deleteFolderUseCase = makeDeleteFolderUseCase();
        await deleteFolderUseCase.execute({ tenantId, folderId: id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FOLDER_DELETE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            folderName: folder.name,
          },
          oldData: {
            id: folder.folderId.toString(),
            name: folder.name,
            path: folder.path,
          },
        });

        return reply.status(204).send(null);
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
