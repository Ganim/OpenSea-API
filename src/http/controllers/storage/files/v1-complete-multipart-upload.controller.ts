import { env } from '@/@env';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
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
        permissionCode: PermissionCodes.STORAGE.FILES.CREATE,
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
      }),
      response: {
        200: z.object({
          key: z.string(),
          url: z.string(),
          size: z.number().int(),
          mimeType: z.string(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { key, uploadId, parts, fileName, mimeType, fileSize } =
        request.body as {
          key: string;
          uploadId: string;
          parts: Array<{ partNumber: number; etag: string }>;
          fileName: string;
          mimeType: string;
          fileSize: number;
        };

      try {
        const fileUploadService = env.S3_ENDPOINT
          ? new S3FileUploadService()
          : new LocalFileUploadService();

        const result = await fileUploadService.completeMultipartUpload(
          key,
          uploadId,
          parts,
        );

        return reply.status(200).send({
          key: result.key,
          url: result.url,
          size: fileSize,
          mimeType,
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

export async function abortMultipartUploadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/multipart/abort',
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
      summary: 'Abort a multipart upload',
      description: 'Aborts an in-progress multipart upload and cleans up uploaded parts.',
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
          ? new S3FileUploadService()
          : new LocalFileUploadService();

        await fileUploadService.abortMultipartUpload(key, uploadId);

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
