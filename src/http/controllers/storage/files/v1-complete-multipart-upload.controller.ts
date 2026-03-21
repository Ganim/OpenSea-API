import { env } from '@/@env';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PlanLimitExceededError } from '@/@errors/use-cases/plan-limit-exceeded-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { isAllowedMimeType } from '@/constants/storage/allowed-mime-types';
import { PermissionCodes } from '@/constants/rbac';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FileType } from '@/entities/storage';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileResponseSchema } from '@/http/schemas/storage';
import { storageFileToDTO } from '@/mappers/storage';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { PrismaStorageFileVersionsRepository } from '@/repositories/storage/prisma/prisma-storage-file-versions-repository';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { TenantContextService } from '@/services/tenant/tenant-context-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function completeMultipartUploadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/multipart/complete',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.REGISTER,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Complete a multipart upload',
      description:
        'Completes a multipart upload by sending the ETags for each part. Call this after all parts have been uploaded.',
      security: [{ bearerAuth: [] }],
      body: z.object({
        key: z.string().min(1),
        uploadId: z.string().min(1),
        parts: z.array(
          z.object({
            partNumber: z.number().int().positive(),
            etag: z.string().min(1),
          }),
        ),
        fileName: z.string().min(1).max(256),
        mimeType: z.string().min(1).max(128),
        fileSize: z.number().int().positive(),
        folderId: z.string().uuid().nullable().optional(),
        entityType: z.string().max(64).optional(),
        entityId: z.string().uuid().optional(),
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
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const {
        key,
        uploadId,
        parts,
        fileName,
        mimeType,
        fileSize,
        folderId,
        entityType,
        entityId,
      } = request.body as {
        key: string;
        uploadId: string;
        parts: Array<{ partNumber: number; etag: string }>;
        fileName: string;
        mimeType: string;
        fileSize: number;
        folderId?: string | null;
        entityType?: string;
        entityId?: string;
      };

      // Revalidate MIME type (was validated at initiate, but re-check to prevent tampering)
      if (!isAllowedMimeType(mimeType)) {
        return reply.status(400).send({
          message: `Tipo de arquivo não permitido: ${mimeType}`,
        });
      }

      try {
        const fileUploadService = env.S3_ENDPOINT
          ? S3FileUploadService.getInstance()
          : new LocalFileUploadService();

        // Check storage quota
        const tenantContext = new TenantContextService();
        const limits = await tenantContext.getPlanLimits(tenantId);
        if (limits.maxStorageMb > 0) {
          const storageFilesRepo = new PrismaStorageFilesRepository();
          const withinQuota = await storageFilesRepo.atomicCheckQuota(
            tenantId,
            fileSize,
            limits.maxStorageMb * 1024 * 1024,
          );
          if (!withinQuota) {
            // Abort the multipart upload to clean up S3
            await fileUploadService.abortMultipartUpload(key, uploadId);
            throw new PlanLimitExceededError(
              'MB de armazenamento',
              Math.round(limits.maxStorageMb),
            );
          }
        }

        // Complete the S3 multipart upload
        await fileUploadService.completeMultipartUpload(key, uploadId, parts);

        // Verify target folder exists (if specified)
        const storageFoldersRepo = new PrismaStorageFoldersRepository();
        let filePath = `/${fileName}`;

        if (folderId) {
          const folder = await storageFoldersRepo.findById(
            new UniqueEntityID(folderId),
            tenantId,
          );
          if (!folder) {
            throw new ResourceNotFoundError('Folder not found');
          }
          filePath = folder.buildChildPath(fileName);
        }

        // Create StorageFile record in the database
        const storageFilesRepo = new PrismaStorageFilesRepository();
        const fileType = FileType.fromMimeType(mimeType);
        const createdFile = await storageFilesRepo.create({
          tenantId,
          folderId: folderId ?? null,
          name: fileName,
          originalName: fileName,
          fileKey: key,
          path: filePath,
          size: fileSize,
          mimeType,
          fileType: fileType.value,
          entityType: entityType ?? null,
          entityId: entityId ?? null,
          uploadedBy: userId,
        });

        // Create initial version record
        const fileVersionsRepo = new PrismaStorageFileVersionsRepository();
        await fileVersionsRepo.create({
          fileId: createdFile.id.toString(),
          version: 1,
          fileKey: key,
          size: fileSize,
          mimeType,
          changeNote: 'Initial upload (multipart)',
          uploadedBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_UPLOAD,
          entityId: createdFile.id.toString(),
          placeholders: {
            userName: userId,
            fileName,
            folderName: folderId ?? 'root',
          },
          newData: {
            fileName,
            mimeType,
            fileSize,
            uploadMethod: 'multipart',
          },
        });

        return reply.status(201).send({ file: storageFileToDTO(createdFile) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
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

export async function abortMultipartUploadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/multipart/abort',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.REGISTER,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Abort a multipart upload',
      description:
        'Aborts an in-progress multipart upload and cleans up uploaded parts.',
      security: [{ bearerAuth: [] }],
      body: z.object({
        key: z.string().min(1),
        uploadId: z.string().min(1),
      }),
      response: {
        204: z.null().describe('Upload aborted successfully'),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { key, uploadId } = request.body as {
        key: string;
        uploadId: string;
      };

      try {
        const fileUploadService = env.S3_ENDPOINT
          ? S3FileUploadService.getInstance()
          : new LocalFileUploadService();

        await fileUploadService.abortMultipartUpload(key, uploadId);

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
