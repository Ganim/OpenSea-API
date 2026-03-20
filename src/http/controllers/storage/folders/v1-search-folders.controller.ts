import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFolderResponseSchema } from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeSearchFoldersUseCase } from '@/use-cases/storage/folders/factories/make-search-folders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function searchFoldersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folders/search',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.ACCESS,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Search folders by name',
      querystring: z.object({
        q: z.string().min(1).max(256),
      }),
      response: {
        200: z.object({
          folders: z.array(storageFolderResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { q } = request.query;

      const searchFoldersUseCase = makeSearchFoldersUseCase();
      const { folders } = await searchFoldersUseCase.execute({
        tenantId,
        query: q,
      });

      return reply.status(200).send({
        folders: folders.map((folder) => storageFolderToDTO(folder)),
      });
    },
  });
}
