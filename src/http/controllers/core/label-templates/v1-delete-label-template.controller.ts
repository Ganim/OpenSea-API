import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { getUserOrganizationId } from '@/http/helpers/organization.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetLabelTemplateByIdUseCase } from '@/use-cases/core/label-templates/factories/make-get-label-template-by-id-use-case';
import { makeDeleteLabelTemplateUseCase } from '@/use-cases/core/label-templates/factories/make-delete-label-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteLabelTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/label-templates/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.DELETE,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'Delete a label template',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        400: z.object({
          message: z.string(),
        }),
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

        const deleteLabelTemplateUseCase = makeDeleteLabelTemplateUseCase();
        await deleteLabelTemplateUseCase.execute({
          id,
          organizationId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.LABEL_TEMPLATE_DELETE,
          entityId: id,
          placeholders: { userName, templateName: template.name },
        });

        return reply.status(204).send();
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
