import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listFilesQuerySchema,
  storageFileResponseSchema,
} from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { makeListFilesUseCase } from '@/use-cases/storage/files/factories/make-list-files-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listFilesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'List files with filters and pagination',
      querystring: listFilesQuerySchema,
      response: {
        200: z.object({
          files: z.array(storageFileResponseSchema),
          meta: z.object({
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
            pages: z.number().int(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        page,
        limit,
        folderId,
        fileType,
        entityType,
        entityId,
        search,
        status,
      } = request.query;

      const listFilesUseCase = makeListFilesUseCase();
      const {
        files,
        total,
        page: currentPage,
        limit: currentLimit,
        pages,
      } = await listFilesUseCase.execute({
        tenantId,
        folderId,
        fileType,
        entityType,
        entityId,
        search,
        status,
        page,
        limit,
      });

      return reply.status(200).send({
        files: files.map(storageFileToDTO),
        meta: {
          total,
          page: currentPage,
          limit: currentLimit,
          pages,
        },
      });
    },
  });
}
