import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetLabelTemplateByIdUseCase } from '@/use-cases/core/label-templates/factories/make-get-label-template-by-id-use-case';
import { PrismaStorageFoldersRepository } from '@/repositories/storage/prisma/prisma-storage-folders-repository';
import { makeInitializeTenantFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-initialize-tenant-folders-use-case';
import { makeCreateEntityFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-create-entity-folders-use-case';
import { makeUploadFileUseCase } from '@/use-cases/storage/files/factories/make-upload-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/webp',
  'image/jpeg',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadLabelTemplateImageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/label-templates/:id/upload-image',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.LABEL_TEMPLATES.MODIFY,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'Upload image for label template editor',
      description:
        'Accepts a multipart/form-data upload with a "file" field (PNG/WebP/JPEG/SVG). The image is saved to the label template folder in File Manager and the serve URL is returned for use in the editor.',
      params: z.object({
        id: z.string().uuid(),
      }),
      consumes: ['multipart/form-data'],
      response: {
        200: z.object({ imageUrl: z.string() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        // Get user name for audit
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        // Verify template exists
        const getLabelTemplateByIdUseCase = makeGetLabelTemplateByIdUseCase();
        const { template } = await getLabelTemplateByIdUseCase.execute({
          id,
          tenantId,
        });

        // Parse multipart
        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let fileMimeType = '';
        let originalFilename = 'image.png';

        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'file') {
            fileMimeType = part.mimetype;
            originalFilename = part.filename || originalFilename;
            fileBuffer = await part.toBuffer();
          }
        }

        if (!fileBuffer) {
          throw new BadRequestError('Nenhum arquivo enviado');
        }

        if (!ALLOWED_MIME_TYPES.includes(fileMimeType)) {
          throw new BadRequestError(
            'Tipo de arquivo não permitido. Use PNG, WebP, JPEG ou SVG.',
          );
        }

        if (fileBuffer.length > MAX_FILE_SIZE) {
          throw new BadRequestError('Arquivo muito grande. Máximo: 5MB.');
        }

        // Find or create the label template folder
        const foldersRepo = new PrismaStorageFoldersRepository();
        let folder = await foldersRepo.findByEntityId(
          'label-template',
          id,
          tenantId,
        );

        if (!folder) {
          try {
            const initTenantFolders = makeInitializeTenantFoldersUseCase();
            await initTenantFolders.execute({ tenantId });

            const createEntityFolders = makeCreateEntityFoldersUseCase();
            const { folders } = await createEntityFolders.execute({
              tenantId,
              entityType: 'label-template',
              entityId: id,
              entityName: template.name,
            });
            folder = folders[0];
          } catch {
            folder = await foldersRepo.findByEntityId(
              'label-template',
              id,
              tenantId,
            );
          }
        }

        // Upload the image
        const folderId = folder ? folder.id.toString() : null;
        const uploadFileUseCase = makeUploadFileUseCase();
        const { file: storageFile } = await uploadFileUseCase.execute({
          tenantId,
          folderId,
          file: {
            buffer: fileBuffer,
            filename: `label_img_${Date.now()}_${originalFilename}`,
            mimetype: fileMimeType,
          },
          entityType: 'label-image',
          entityId: id,
          uploadedBy: userId,
        });

        const imageUrl = `/v1/storage/files/${storageFile.id.toString()}/serve`;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.LABEL_TEMPLATE_IMAGE_UPLOAD,
          entityId: id,
          placeholders: { userName, templateName: template.name },
        });

        return reply.status(200).send({ imageUrl });
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
