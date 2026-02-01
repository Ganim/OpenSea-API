import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { getUserOrganizationId } from '@/http/helpers/organization.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { thumbnailResponseSchema } from '@/http/schemas/core/label-templates/label-template.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetLabelTemplateByIdUseCase } from '@/use-cases/core/label-templates/factories/make-get-label-template-by-id-use-case';
import { makeGenerateLabelTemplateThumbnailUseCase } from '@/use-cases/core/label-templates/factories/make-generate-label-template-thumbnail-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function generateLabelTemplateThumbnailController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/label-templates/:id/generate-thumbnail',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.UPDATE,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'Generate thumbnail for a label template',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: thumbnailResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const organizationId = await getUserOrganizationId(userId);

      if (!organizationId) {
        return reply
          .status(400)
          .send({ message: 'User must belong to an organization' });
      }

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const getLabelTemplateByIdUseCase = makeGetLabelTemplateByIdUseCase();
        const { template } = await getLabelTemplateByIdUseCase.execute({
          id,
          organizationId,
        });

        const generateThumbnailUseCase =
          makeGenerateLabelTemplateThumbnailUseCase();
        const { thumbnailUrl } = await generateThumbnailUseCase.execute({
          id,
          organizationId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.LABEL_TEMPLATE_THUMBNAIL_GENERATE,
          entityId: id,
          placeholders: { userName, templateName: template.name },
        });

        return reply.status(200).send({ thumbnailUrl });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
