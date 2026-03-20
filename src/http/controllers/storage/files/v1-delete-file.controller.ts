import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetFileUseCase } from '@/use-cases/storage/files/factories/make-get-file-use-case';
import { makeDeleteFileUseCase } from '@/use-cases/storage/files/factories/make-delete-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/storage/files/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.REMOVE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Delete a file (soft delete)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const getFileUseCase = makeGetFileUseCase();
        const { file } = await getFileUseCase.execute({
          tenantId,
          fileId: id,
        });

        const deleteFileUseCase = makeDeleteFileUseCase();
        await deleteFileUseCase.execute({ tenantId, fileId: id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_DELETE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            fileName: file.name,
          },
          oldData: {
            id: file.fileId.toString(),
            name: file.name,
            path: file.path,
            fileType: file.fileType,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
