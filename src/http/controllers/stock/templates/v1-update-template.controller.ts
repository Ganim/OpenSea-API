import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  templateResponseSchema,
  updateTemplateSchema,
} from '@/http/schemas/stock.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetTemplateByIdUseCase } from '@/use-cases/stock/templates/factories/make-get-template-by-id-use-case';
import { makeUpdateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-update-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/templates/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TEMPLATES.UPDATE,
        resource: 'templates',
      }),
    ],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Update a template',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateTemplateSchema,
      response: {
        200: z.object({
          template: templateResponseSchema,
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
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getTemplateByIdUseCase = makeGetTemplateByIdUseCase();

        const [{ user }, { template: oldTemplate }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getTemplateByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updateTemplate = makeUpdateTemplateUseCase();
        const { template } = await updateTemplate.execute({
          id,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.TEMPLATE_UPDATE,
          entityId: template.id,
          placeholders: { userName, templateName: template.name },
          oldData: { name: oldTemplate.name },
          newData: request.body,
        });

        return reply.status(200).send({ template });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        // Erro de constraint unique do Prisma (nome duplicado)
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          return reply
            .status(400)
            .send({ message: 'Template with this name already exists' });
        }

        throw error;
      }
    },
  });
}
