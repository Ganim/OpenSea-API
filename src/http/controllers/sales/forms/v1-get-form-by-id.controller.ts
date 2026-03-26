import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { formResponseSchema } from '@/http/schemas/sales/forms/form.schema';
import { makeGetFormByIdUseCase } from '@/use-cases/sales/forms/factories/make-get-form-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getFormByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/forms/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.FORMS.ACCESS,
        resource: 'forms',
      }),
    ],
    schema: {
      tags: ['Sales - Forms'],
      summary: 'Get form by ID with fields',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ form: formResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetFormByIdUseCase();
        const { form } = await useCase.execute({ tenantId, formId: id });

        return reply.status(200).send({ form } as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
