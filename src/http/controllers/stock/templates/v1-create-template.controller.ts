import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTemplateSchema,
  templateResponseSchema,
} from '@/http/schemas/stock.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-create-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/templates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TEMPLATES.CREATE,
        resource: 'templates',
      }),
    ],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Create a new template',
      body: createTemplateSchema,
      response: {
        201: z.object({
          template: templateResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createTemplate = makeCreateTemplateUseCase();
        const { template } = await createTemplate.execute({
          tenantId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.TEMPLATE_CREATE,
          entityId: template.id,
          placeholders: { userName, templateName: template.name },
          newData: request.body,
        });

        return reply.status(201).send({ template });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
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
