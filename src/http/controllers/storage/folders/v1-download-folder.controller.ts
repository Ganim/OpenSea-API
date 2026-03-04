import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDownloadFolderUseCase } from '@/use-cases/storage/folders/factories/make-download-folder-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function downloadFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folders/:id/download',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.USER_FOLDERS.DOWNLOAD,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Download a folder as a ZIP archive',
      description:
        'Collects all files from the folder and its subfolders, generates a ZIP archive, uploads it to temporary storage, and returns a presigned download URL.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          url: z.string(),
          fileName: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const downloadFolderUseCase = makeDownloadFolderUseCase();
        const { url, fileName } = await downloadFolderUseCase.execute({
          tenantId,
          folderId: id,
        });

        return reply.status(200).send({ url, fileName });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('limite')) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
