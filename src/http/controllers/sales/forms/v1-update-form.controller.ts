import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  formResponseSchema,
  updateFormSchema,
} from '@/http/schemas/sales/forms/form.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateFormUseCase } from '@/use-cases/sales/forms/factories/make-update-form-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateFormController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/forms/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.FORMS.MODIFY,
        resource: 'forms',
      }),
    ],
    schema: {
      tags: ['Sales - Forms'],
      summary: 'Update a draft form',
      params: z.object({ id: z.string().uuid() }),
      body: updateFormSchema,
      response: {
        200: z.object({ form: formResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateFormUseCase();
        const { form } = await useCase.execute({
          tenantId,
          formId: id,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.FORM_UPDATE,
          entityId: form.id,
          placeholders: { userName, formTitle: form.title },
          newData: body as Record<string, unknown>,
        });

        return reply.status(200).send({ form });
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
