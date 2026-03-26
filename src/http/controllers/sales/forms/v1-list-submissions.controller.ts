import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { formSubmissionResponseSchema } from '@/http/schemas/sales/forms/form.schema';
import { makeListSubmissionsUseCase } from '@/use-cases/sales/forms/factories/make-list-submissions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listSubmissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/forms/:id/submissions',
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
      summary: 'List submissions for a form',
      params: z.object({ id: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          submissions: z.array(formSubmissionResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;
      const query = request.query;

      try {
        const useCase = makeListSubmissionsUseCase();
        const result = await useCase.execute({
          tenantId,
          formId: id,
          ...query,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
