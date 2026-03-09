import { env } from '@/@env';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { isAllowedMimeType } from '@/constants/storage/allowed-mime-types';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const PART_SIZE = 5 * 1024 * 1024; // 5MB per part

export async function initiateMultipartUploadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/multipart/initiate',
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
      summary: 'Initiate a multipart upload for large files',
      description:
        'Starts a multipart upload and returns presigned URLs for each part. Use for files larger than 50MB.',
      security: [{ bearerAuth: [] }],
      body: z.object({
        fileName: z.string().min(1).max(256),
        mimeType: z.string().min(1).max(128),
        fileSize: z.number().int().positive(),
        folderId: z.string().uuid().nullable().optional(),
        prefix: z.string().max(128).optional(),
      }),
      response: {
        200: z.object({
          uploadId: z.string(),
          key: z.string(),
          partUrls: z.array(
            z.object({
              partNumber: z.number().int(),
              url: z.string(),
            }),
          ),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileName, mimeType, fileSize, folderId, prefix } =
        request.body as {
          fileName: string;
          mimeType: string;
          fileSize: number;
          folderId?: string | null;
          prefix?: string;
        };

      // Validate MIME type
      if (!isAllowedMimeType(mimeType)) {
        return reply.status(400).send({
          message: `Tipo de arquivo não permitido: ${mimeType}`,
        });
      }

      try {
        const fileUploadService = env.S3_ENDPOINT
          ? S3FileUploadService.getInstance()
          : new LocalFileUploadService();

        const uploadPrefix =
          prefix ??
          (folderId
            ? `storage/${tenantId}/${folderId}`
            : `storage/${tenantId}`);

        const { uploadId, key } =
          await fileUploadService.initiateMultipartUpload(fileName, mimeType, {
            prefix: uploadPrefix,
          });

        const totalParts = Math.ceil(fileSize / PART_SIZE);
        const partUrls = await fileUploadService.getPresignedPartUrls(
          key,
          uploadId,
          totalParts,
        );

        return reply.status(200).send({
          uploadId,
          key,
          partUrls,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
