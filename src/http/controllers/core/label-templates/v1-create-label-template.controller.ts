import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { getUserOrganizationId } from '@/http/helpers/organization.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createLabelTemplateSchema,
  labelTemplateResponseSchema,
} from '@/http/schemas/core/label-templates/label-template.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateLabelTemplateUseCase } from '@/use-cases/core/label-templates/factories/make-create-label-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createLabelTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/label-templates',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.CREATE,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'Create a new label template',
      body: createLabelTemplateSchema,
      response: {
        201: z.object({
          template: labelTemplateResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
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

        const createLabelTemplateUseCase = makeCreateLabelTemplateUseCase();
        const { template } = await createLabelTemplateUseCase.execute({
          ...request.body,
          organizationId,
          createdById: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.LABEL_TEMPLATE_CREATE,
          entityId: template.id,
          placeholders: { userName, templateName: template.name },
          newData: request.body,
        });

        return reply.status(201).send({ template });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          return reply
            .status(400)
            .send({ message: 'A template with this name already exists' });
        }

        throw error;
      }
    },
  });
}
