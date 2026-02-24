import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  storageFolderResponseSchema,
  updateStorageFolderSchema,
} from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeUpdateFolderUseCase } from '@/use-cases/storage/folders/factories/make-update-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/storage/folders/:id',
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
      summary: 'Update folder appearance (color and icon)',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateStorageFolderSchema,
      response: {
        200: z.object({
          folder: storageFolderResponseSchema,
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
      const { color, icon } = request.body;

      try {
        const updateFolderUseCase = makeUpdateFolderUseCase();
        const { folder } = await updateFolderUseCase.execute({
          tenantId,
          folderId: id,
          color,
          icon,
        });

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
