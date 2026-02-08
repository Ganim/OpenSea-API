import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  duplicateLabelTemplateSchema,
  labelTemplateResponseSchema,
} from '@/http/schemas/core/label-templates/label-template.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetLabelTemplateByIdUseCase } from '@/use-cases/core/label-templates/factories/make-get-label-template-by-id-use-case';
import { makeDuplicateLabelTemplateUseCase } from '@/use-cases/core/label-templates/factories/make-duplicate-label-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function duplicateLabelTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/label-templates/:id/duplicate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.LABEL_TEMPLATES.DUPLICATE,
        resource: 'label-templates',
      }),
    ],
    schema: {
      tags: ['Core - Label Templates'],
      summary: 'Duplicate a label template',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: duplicateLabelTemplateSchema,
      response: {
        201: z.object({
          template: labelTemplateResponseSchema,
        }),
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
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { name } = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const getLabelTemplateByIdUseCase = makeGetLabelTemplateByIdUseCase();
        const { template: sourceTemplate } =
          await getLabelTemplateByIdUseCase.execute({
            id,
            tenantId,
          });

        const duplicateLabelTemplateUseCase =
          makeDuplicateLabelTemplateUseCase();
        const { template } = await duplicateLabelTemplateUseCase.execute({
          id,
          name,
          tenantId,
          createdById: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.LABEL_TEMPLATE_DUPLICATE,
          entityId: template.id,
          placeholders: {
            userName,
            sourceTemplateName: sourceTemplate.name,
            newTemplateName: template.name,
          },
          newData: { sourceId: id, name },
        });

        return reply.status(201).send({ template });
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
