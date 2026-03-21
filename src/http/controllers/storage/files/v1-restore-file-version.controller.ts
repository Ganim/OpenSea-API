import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  storageFileResponseSchema,
  storageFileVersionResponseSchema,
} from '@/http/schemas/storage';
import { storageFileToDTO, storageFileVersionToDTO } from '@/mappers/storage';
import { makeRestoreFileVersionUseCase } from '@/use-cases/storage/files/factories/make-restore-file-version-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function restoreFileVersionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/:id/versions/:versionId/restore',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ADMIN,
        resource: 'storage-file-versions',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Restore a file to a previous version',
      params: z.object({
        id: z.string().uuid(),
        versionId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          file: storageFileResponseSchema,
          version: storageFileVersionResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id, versionId } = request.params;

      try {
        const restoreFileVersionUseCase = makeRestoreFileVersionUseCase();
        const { file, version } = await restoreFileVersionUseCase.execute({
          tenantId,
          fileId: id,
          versionId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_VERSION_RESTORE,
          entityId: file.fileId.toString(),
          placeholders: {
            userName: request.user.sub,
            fileName: file.name,
            versionNumber: String(version.version),
          },
          newData: {
            versionId,
            restoredVersionNumber: version.version,
          },
        });

        return reply.status(200).send({
          file: storageFileToDTO(file),
          version: storageFileVersionToDTO(version),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
