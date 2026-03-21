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
import { prisma } from '@/lib/prisma';
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
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
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
      const { page, limit, search, sort, sortOrder, viewAll, showHidden } =
        request.query;

      const folderId = id === 'root' ? undefined : id;

      try {
        // Check folder-type permissions
        const listPermissions = makeListUserPermissionsUseCase();
        const { permissions: userPerms } = await listPermissions.execute({
          userId: request.user.sub,
          module: 'tools',
        });

        const permCodes = new Set(
          userPerms
            .filter((p) => p.effect === 'allow')
            .map((p) => p.permission.code.toString()),
        );
        const canViewSystemFolders = permCodes.has(
          PermissionCodes.TOOLS.STORAGE.FOLDERS.ACCESS,
        );
        const canViewFilterFolders = permCodes.has(
          PermissionCodes.TOOLS.STORAGE.FOLDERS.ACCESS,
        );

        // Fetch user's team IDs for visibility filtering
        const teamMembers = await prisma.teamMember.findMany({
          where: {
            userId: request.user.sub,
            tenantId,
            team: { deletedAt: null, isActive: true },
          },
          select: { teamId: true },
        });
        const userTeamIds = teamMembers.map((m) => m.teamId);

        const listFolderContentsUseCase = makeListFolderContentsUseCase();
        const { folders, files, totalFolders, totalFiles, total } =
          await listFolderContentsUseCase.execute({
            tenantId,
            folderId,
            page,
            limit,
            search,
            sort,
            sortOrder,
            userId: request.user.sub,
            userTeamIds,
            isAdmin: request.user.isSuperAdmin === true,
            viewAll: viewAll && request.user.isSuperAdmin === true,
            canViewSystemFolders,
            canViewFilterFolders,
            showHidden,
          });

        // Batch-count children (files + subfolders) per folder in 2 queries
        const folderIds = folders.map((f) => f.folderId.toString());
        const itemCountMap = new Map<string, number>();

        if (folderIds.length > 0) {
          const [fileCounts, subfolderCounts] = await Promise.all([
            prisma.storageFile.groupBy({
              by: ['folderId'],
              where: { folderId: { in: folderIds }, deletedAt: null },
              _count: true,
            }),
            prisma.storageFolder.groupBy({
              by: ['parentId'],
              where: { parentId: { in: folderIds }, deletedAt: null },
              _count: true,
            }),
          ]);

          for (const row of fileCounts) {
            if (row.folderId) {
              itemCountMap.set(
                row.folderId,
                (itemCountMap.get(row.folderId) ?? 0) + row._count,
              );
            }
          }
          for (const row of subfolderCounts) {
            if (row.parentId) {
              itemCountMap.set(
                row.parentId,
                (itemCountMap.get(row.parentId) ?? 0) + row._count,
              );
            }
          }
        }

        return reply.status(200).send({
          folders: folders.map((folder) => {
            const fid = folder.folderId.toString();
            return storageFolderToDTO(folder, itemCountMap.get(fid) ?? 0);
          }),
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
