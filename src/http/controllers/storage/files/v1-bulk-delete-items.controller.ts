import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeBulkDeleteItemsUseCase } from '@/use-cases/storage/files/factories/make-bulk-delete-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function bulkDeleteItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/bulk/delete',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.REMOVE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Bulk'],
      summary: 'Delete multiple files and/or folders (soft delete)',
      body: z.object({
        fileIds: z.array(z.string().uuid()).optional().default([]),
        folderIds: z.array(z.string().uuid()).optional().default([]),
      }),
      response: {
        200: z.object({
          deletedFiles: z.number().int(),
          deletedFolders: z.number().int(),
          errors: z.array(z.string()),
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileIds, folderIds } = request.body;

      try {
        const bulkDeleteUseCase = makeBulkDeleteItemsUseCase();
        const result = await bulkDeleteUseCase.execute({
          tenantId,
          fileIds,
          folderIds,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.BULK_DELETE,
          entityId: 'bulk',
          placeholders: {
            userName: request.user.sub,
            fileCount: String(result.deletedFiles),
            folderCount: String(result.deletedFolders),
          },
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
