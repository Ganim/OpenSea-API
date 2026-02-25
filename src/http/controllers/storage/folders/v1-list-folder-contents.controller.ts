import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  folderContentsQuerySchema,
  storageFolderResponseSchema,
  storageFileResponseSchema,
} from '@/http/schemas/storage';
import { storageFolderToDTO, storageFileToDTO } from '@/mappers/storage';
import { makeListUserPermissionsUseCase } from '@/use-cases/rbac/factories';
import { makeListFolderContentsUseCase } from '@/use-cases/storage/folders/factories/make-list-folder-contents-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listFolderContentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folders/:id/contents',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.INTERFACE.VIEW,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'List folder contents (subfolders and files)',
      description:
        'Use "root" as the id parameter to list root-level folders and files.',
      params: z.object({
        id: z.string(),
      }),
      querystring: folderContentsQuerySchema,
      response: {
        200: z.object({
          folders: z.array(storageFolderResponseSchema),
          files: z.array(storageFileResponseSchema),
          totalFolders: z.number().int(),
          totalFiles: z.number().int(),
          total: z.number().int(),
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
      const { page, limit, search } = request.query;

      const folderId = id === 'root' ? undefined : id;

      try {
        // Check folder-type permissions
        const listPermissions = makeListUserPermissionsUseCase();
        const { permissions: userPerms } = await listPermissions.execute({
          userId: request.user.sub,
          module: 'storage',
        });

        const permCodes = new Set(
          userPerms
            .filter((p) => p.effect === 'allow')
            .map((p) => p.permission.code.toString()),
        );
        const canViewSystemFolders = permCodes.has(
          'storage.system-folders.list',
        );
        const canViewFilterFolders = permCodes.has(
          'storage.filter-folders.list',
        );

        const listFolderContentsUseCase = makeListFolderContentsUseCase();
        const { folders, files, totalFolders, totalFiles, total } =
          await listFolderContentsUseCase.execute({
            tenantId,
            folderId,
            page,
            limit,
            search,
            userId: request.user.sub,
            isAdmin: request.user.isSuperAdmin === true,
            canViewSystemFolders,
            canViewFilterFolders,
          });

        return reply.status(200).send({
          folders: folders.map((folder) => storageFolderToDTO(folder)),
          files: files.map(storageFileToDTO),
          totalFolders,
          totalFiles,
          total,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
