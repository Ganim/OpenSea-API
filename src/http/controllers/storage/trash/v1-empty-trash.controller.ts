import { PermissionCodes } from '@/constants/rbac';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeEmptyTrashUseCase } from '@/use-cases/storage/files/factories/make-empty-trash-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function emptyTrashController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/storage/trash/empty',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.REMOVE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Trash'],
      summary: 'Permanently delete all items in trash',
      response: {
        200: z.object({
          deletedFiles: z.number().int(),
          deletedFolders: z.number().int(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeEmptyTrashUseCase();
      const result = await useCase.execute({ tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.STORAGE.EMPTY_TRASH,
        entityId: tenantId,
        placeholders: {
          userName: request.user.sub,
          fileCount: String(result.deletedFiles),
          folderCount: String(result.deletedFolders),
        },
      });

      return reply.status(200).send({
        deletedFiles: result.deletedFiles,
        deletedFolders: result.deletedFolders,
      });
    },
  });
}
