import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileResponseSchema } from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { makeRestoreFileUseCase } from '@/use-cases/storage/files/factories/make-restore-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function restoreFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/trash/restore-file/:fileId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.MODIFY,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Trash'],
      summary: 'Restore a deleted file from trash',
      params: z.object({
        fileId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          file: storageFileResponseSchema,
          relocatedToRoot: z.boolean(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileId } = request.params;

      try {
        const useCase = makeRestoreFileUseCase();
        const { file, relocatedToRoot } = await useCase.execute({
          tenantId,
          fileId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_RESTORE,
          entityId: file.id.toString(),
          placeholders: {
            userName: request.user.sub,
            fileName: file.name,
          },
        });

        return reply
          .status(200)
          .send({ file: storageFileToDTO(file), relocatedToRoot });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
