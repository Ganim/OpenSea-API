import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeBulkMoveItemsUseCase } from '@/use-cases/storage/files/factories/make-bulk-move-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function bulkMoveItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/bulk/move',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.FILES.UPDATE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Bulk'],
      summary: 'Move multiple files and/or folders to a target folder',
      body: z.object({
        fileIds: z.array(z.string().uuid()).optional().default([]),
        folderIds: z.array(z.string().uuid()).optional().default([]),
        targetFolderId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          movedFiles: z.number().int(),
          movedFolders: z.number().int(),
          errors: z.array(z.string()),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileIds, folderIds, targetFolderId } = request.body;

      try {
        const bulkMoveUseCase = makeBulkMoveItemsUseCase();
        const result = await bulkMoveUseCase.execute({
          tenantId,
          fileIds,
          folderIds,
          targetFolderId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.BULK_MOVE,
          entityId: targetFolderId,
          placeholders: {
            userName: request.user.sub,
            fileCount: String(result.movedFiles),
            folderCount: String(result.movedFolders),
            targetFolder: targetFolderId,
          },
        });

        return reply.status(200).send(result);
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
