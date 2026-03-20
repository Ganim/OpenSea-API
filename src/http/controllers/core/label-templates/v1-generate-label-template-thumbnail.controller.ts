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
import { makeGenerateLabelTemplateThumbnailUseCase } from '@/use-cases/core/label-templates/factories/make-generate-label-template-thumbnail-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/png', 'image/webp', 'image/jpeg'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function generateLabelTemplateThumbnailController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/label-templates/:id/generate-thumbnail',
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
      summary: 'Upload thumbnail for a label template',
      description:
        'Accepts a multipart/form-data upload with a "file" field (PNG/WebP/JPEG). The thumbnail is saved to the label template folder in File Manager.',
      params: z.object({
        id: z.string().uuid(),
      }),
      consumes: ['multipart/form-data'],
      response: {
        200: z.object({ thumbnailUrl: z.string() }),
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
        let originalFilename = 'thumbnail.png';

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
            'Tipo de arquivo não permitido. Use PNG, WebP ou JPEG.',
          );
        }

        if (fileBuffer.length > MAX_FILE_SIZE) {
          throw new BadRequestError('Arquivo muito grande. Máximo: 2MB.');
        }

        const generateThumbnailUseCase =
          makeGenerateLabelTemplateThumbnailUseCase();
        const { thumbnailUrl } = await generateThumbnailUseCase.execute({
          id,
          tenantId,
          file: {
            buffer: fileBuffer,
            filename: `thumbnail_${Date.now()}.${fileMimeType.split('/')[1] || 'png'}`,
            mimetype: fileMimeType,
          },
          uploadedBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.LABEL_TEMPLATE_THUMBNAIL_GENERATE,
          entityId: id,
          placeholders: { userName, templateName: template.name },
        });

        return reply.status(200).send({ thumbnailUrl });
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
