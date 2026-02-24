import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  renameStorageFileSchema,
  storageFileResponseSchema,
} from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { makeGetFileUseCase } from '@/use-cases/storage/files/factories/make-get-file-use-case';
import { makeRenameFileUseCase } from '@/use-cases/storage/files/factories/make-rename-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function renameFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/storage/files/:id/rename',
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
      summary: 'Rename a file',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: renameStorageFileSchema,
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
      const { name } = request.body;

      try {
        const getFileUseCase = makeGetFileUseCase();
        const { file: oldFile } = await getFileUseCase.execute({
          tenantId,
          fileId: id,
        });

        const renameFileUseCase = makeRenameFileUseCase();
        const { file } = await renameFileUseCase.execute({
          tenantId,
          fileId: id,
          name,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_RENAME,
          entityId: file.fileId.toString(),
          placeholders: {
            userName: request.user.sub,
            oldName: oldFile.name,
            newName: file.name,
          },
          oldData: { name: oldFile.name },
          newData: { name: file.name },
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
