import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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
import { makeUploadFileVersionUseCase } from '@/use-cases/storage/files/factories/make-upload-file-version-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function uploadFileVersionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/:id/versions',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.VERSIONS.CREATE,
        resource: 'storage-file-versions',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Upload a new version of an existing file',
      description:
        'Upload a new file version as a multipart/form-data request. Include a "file" field and optionally a "changeNote" field.',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        201: z.object({
          file: storageFileResponseSchema,
          version: storageFileVersionResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: fileId } = request.params as { id: string };

      try {
        const multipartFile = await request.file();

        if (!multipartFile) {
          return reply.status(400).send({ message: 'No file uploaded' });
        }

        const fileBuffer = await multipartFile.toBuffer();
        const changeNote =
          (multipartFile.fields.changeNote as { value?: string })?.value ||
          undefined;

        const uploadFileVersionUseCase = makeUploadFileVersionUseCase();
        const { file, version } = await uploadFileVersionUseCase.execute({
          tenantId,
          fileId,
          file: {
            buffer: fileBuffer,
            filename: multipartFile.filename,
            mimetype: multipartFile.mimetype,
          },
          changeNote,
          uploadedBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_VERSION_UPLOAD,
          entityId: file.fileId.toString(),
          placeholders: {
            userName: userId,
            fileName: file.name,
            versionNumber: String(version.version),
          },
          newData: {
            fileName: multipartFile.filename,
            versionNumber: version.version,
            changeNote,
          },
        });

        return reply.status(201).send({
          file: storageFileToDTO(file),
          version: storageFileVersionToDTO(version),
        });
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
