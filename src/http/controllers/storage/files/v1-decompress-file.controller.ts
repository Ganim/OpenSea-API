import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileResponseSchema } from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { makeDecompressFileUseCase } from '@/use-cases/storage/files/factories/make-decompress-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function decompressFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/:id/decompress',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.FILES.CREATE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Decompress a ZIP file into the target folder',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z
        .object({
          targetFolderId: z.string().uuid().optional().nullable(),
        })
        .optional(),
      response: {
        201: z.object({
          files: z.array(storageFileResponseSchema),
          folderCount: z.number().int(),
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
      const { id: fileId } = request.params;
      const targetFolderId = (request.body as { targetFolderId?: string })
        ?.targetFolderId;

      try {
        const decompressFileUseCase = makeDecompressFileUseCase();
        const { files, folderCount } = await decompressFileUseCase.execute({
          tenantId,
          fileId,
          targetFolderId,
          userId: request.user.sub,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_DECOMPRESS,
          entityId: fileId,
          placeholders: {
            userName: request.user.sub,
            fileName: fileId,
            extractedCount: String(files.length),
            folderCount: String(folderCount),
          },
          newData: {
            extractedFiles: files.length,
            extractedFolders: folderCount,
            targetFolderId: targetFolderId ?? 'root',
          },
        });

        return reply.status(201).send({
          files: files.map(storageFileToDTO),
          folderCount,
        });
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
