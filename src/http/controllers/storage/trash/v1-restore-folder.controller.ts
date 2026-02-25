import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFolderResponseSchema } from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeRestoreFolderUseCase } from '@/use-cases/storage/folders/factories/make-restore-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function restoreFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/trash/restore-folder/:folderId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.USER_FOLDERS.UPDATE,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Trash'],
      summary: 'Restore a deleted folder from trash (with descendants and files)',
      params: z.object({
        folderId: z.string().uuid(),
      }),
      response: {
        200: z.object({ folder: storageFolderResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { folderId } = request.params;

      try {
        const useCase = makeRestoreFolderUseCase();
        const { folder } = await useCase.execute({ tenantId, folderId });

        return reply.status(200).send({ folder: storageFolderToDTO(folder) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
