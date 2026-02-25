import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  storageFileResponseSchema,
  storageFolderResponseSchema,
} from '@/http/schemas/storage';
import { storageFileToDTO, storageFolderToDTO } from '@/mappers/storage';
import { makeSearchStorageUseCase } from '@/use-cases/storage/files/factories/make-search-storage-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function searchStorageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/search',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.FILES.READ,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Search'],
      summary: 'Search files and folders across all directories',
      querystring: z.object({
        query: z.string().min(2).max(256),
        fileType: z
          .enum([
            'IMAGE',
            'DOCUMENT',
            'SPREADSHEET',
            'PDF',
            'VIDEO',
            'AUDIO',
            'ARCHIVE',
            'OTHER',
          ])
          .optional(),
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .default(20),
      }),
      response: {
        200: z.object({
          files: z.array(storageFileResponseSchema),
          folders: z.array(storageFolderResponseSchema),
          totalFiles: z.number().int(),
          totalFolders: z.number().int(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { query, fileType, page, limit } = request.query;

      const searchUseCase = makeSearchStorageUseCase();
      const result = await searchUseCase.execute({
        tenantId,
        query,
        fileType,
        page,
        limit,
      });

      return reply.status(200).send({
        files: result.files.map(storageFileToDTO),
        folders: result.folders.map((f) => storageFolderToDTO(f)),
        totalFiles: result.totalFiles,
        totalFolders: result.totalFolders,
      });
    },
  });
}
