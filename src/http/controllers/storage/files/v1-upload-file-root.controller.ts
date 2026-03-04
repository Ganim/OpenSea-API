import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { validateAgainstStorageSettings } from '@/constants/storage/allowed-mime-types';
import { logAudit } from '@/http/helpers/audit.helper';
import { resolveUserStorageSettings } from '@/http/helpers/resolve-storage-settings';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileResponseSchema } from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import { makeUploadFileUseCase } from '@/use-cases/storage/files/factories/make-upload-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function uploadFileRootController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.FILES.CREATE,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Upload a file to the root (no folder)',
      description:
        'Upload a file as a multipart/form-data request without a parent folder. Include a "file" field with the file data.',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
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
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const multipartFile = await request.file();

        if (!multipartFile) {
          return reply.status(400).send({ message: 'No file uploaded' });
        }

        const fileBuffer = await multipartFile.toBuffer();

        // Validate against user's permission group storage settings
        const groupSettings = await resolveUserStorageSettings(userId);
        if (groupSettings) {
          const validationError = validateAgainstStorageSettings(
            multipartFile.mimetype,
            fileBuffer.length,
            groupSettings,
          );
          if (validationError) {
            return reply.status(400).send({ message: validationError });
          }
        }

        // Resolve tenant storage quota
        const tenantContext = new TenantContextService();
        const limits = await tenantContext.getPlanLimits(tenantId);
        const maxStorageBytes =
          limits.maxStorageMb > 0
            ? limits.maxStorageMb * 1024 * 1024
            : undefined;

        const uploadFileUseCase = makeUploadFileUseCase();
        const { file } = await uploadFileUseCase.execute({
          tenantId,
          folderId: null,
          file: {
            buffer: fileBuffer,
            filename: multipartFile.filename,
            mimetype: multipartFile.mimetype,
          },
          uploadedBy: userId,
          maxStorageBytes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_UPLOAD,
          entityId: file.fileId.toString(),
          placeholders: {
            userName: userId,
            fileName: file.name,
            folderName: 'root',
          },
          newData: {
            fileName: multipartFile.filename,
            mimeType: multipartFile.mimetype,
            fileSize: fileBuffer.length,
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
