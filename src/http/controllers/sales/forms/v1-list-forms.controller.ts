import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { formResponseSchema } from '@/http/schemas/sales/forms/form.schema';
import { makeListFormsUseCase } from '@/use-cases/sales/forms/factories/make-list-forms-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listFormsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/forms',
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
      summary: 'List forms',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
      }),
      response: {
        200: z.object({
          forms: z.array(formResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;
      const tenantId = request.user.tenantId!;

      const useCase = makeListFormsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result as any);
    },
  });
}
