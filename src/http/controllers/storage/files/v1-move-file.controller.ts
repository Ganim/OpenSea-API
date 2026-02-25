import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  moveStorageFileSchema,
  storageFileResponseSchema,
} from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { makeMoveFileUseCase } from '@/use-cases/storage/files/factories/make-move-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function moveFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/storage/files/:id/move',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.FILES.UPDATE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Move a file to a different folder',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: moveStorageFileSchema,
      response: {
        200: z.object({
          file: storageFileResponseSchema,
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
      const { id } = request.params;
      const { folderId } = request.body;

      try {
        const moveFileUseCase = makeMoveFileUseCase();
        const { file } = await moveFileUseCase.execute({
          tenantId,
          fileId: id,
          targetFolderId: folderId ?? null,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_MOVE,
          entityId: file.fileId.toString(),
          placeholders: {
            userName: request.user.sub,
            fileName: file.name,
            targetFolder: folderId ?? 'root',
          },
          newData: { folderId, path: file.path },
        });

        return reply.status(200).send({ file: storageFileToDTO(file) });
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
