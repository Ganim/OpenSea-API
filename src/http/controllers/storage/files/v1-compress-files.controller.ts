import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileResponseSchema } from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import { makeCompressFilesUseCase } from '@/use-cases/storage/files/factories/make-compress-files-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function compressFilesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/compress',
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
      summary: 'Compress selected files/folders into a ZIP',
      body: z.object({
        fileIds: z.array(z.string().uuid()).default([]),
        folderIds: z.array(z.string().uuid()).default([]),
        targetFolderId: z.string().uuid().optional().nullable(),
      }),
      response: {
        201: z.object({
          file: storageFileResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        413: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileIds, folderIds, targetFolderId } = request.body;

      try {
        // Resolve tenant storage quota
        const tenantContext = new TenantContextService();
        const limits = await tenantContext.getPlanLimits(tenantId);
        const maxStorageBytes =
          limits.maxStorageMb > 0
            ? limits.maxStorageMb * 1024 * 1024
            : undefined;

        const compressFilesUseCase = makeCompressFilesUseCase();
        const { file } = await compressFilesUseCase.execute({
          tenantId,
          fileIds,
          folderIds,
          targetFolderId,
          userId: request.user.sub,
          maxStorageBytes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_COMPRESS,
          entityId: file.id.toString(),
          placeholders: {
            userName: request.user.sub,
            fileName: file.name,
            fileCount: String(fileIds.length + folderIds.length),
          },
          newData: {
            fileIds,
            folderIds,
            resultFileName: file.name,
          },
        });

        return reply.status(201).send({ file: storageFileToDTO(file) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof PlanLimitExceededError) {
          return reply.status(413).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
