import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileResponseSchema } from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { makeGetFilterFolderContentsUseCase } from '@/use-cases/storage/filters/factories/make-get-filter-folder-contents-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getFilterFolderContentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folders/:id/filter-contents',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FOLDERS.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Get filter folder contents',
      description:
        'Returns all files matching the filter folder file type across the entire tenant. Filter folders are virtual folders that aggregate files by type.',
      params: z.object({
        id: z.string().uuid(),
      }),
      querystring: z.object({
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
          meta: z.object({
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
            pages: z.number().int(),
          }),
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
      const { id: folderId } = request.params;
      const { page, limit } = request.query;

      try {
        const getFilterFolderContentsUseCase =
          makeGetFilterFolderContentsUseCase();

        const {
          files,
          total,
          page: currentPage,
          limit: currentLimit,
          pages,
        } = await getFilterFolderContentsUseCase.execute({
          tenantId,
          folderId,
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
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
