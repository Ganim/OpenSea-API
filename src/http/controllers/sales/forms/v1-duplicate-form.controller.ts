import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { formResponseSchema } from '@/http/schemas/sales/forms/form.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDuplicateFormUseCase } from '@/use-cases/sales/forms/factories/make-duplicate-form-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function duplicateFormController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/forms/:id/duplicate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.FORMS.REGISTER,
        resource: 'forms',
      }),
    ],
    schema: {
      tags: ['Sales - Forms'],
      summary: 'Duplicate a form as DRAFT',
      params: z.object({ id: z.string().uuid() }),
      response: {
        201: z.object({ form: formResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDuplicateFormUseCase();
        const { form } = await useCase.execute({
          tenantId,
          formId: id,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.FORM_DUPLICATE,
          entityId: form.id,
          placeholders: { userName, formTitle: form.title },
        });

        return reply.status(201).send({ form });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
