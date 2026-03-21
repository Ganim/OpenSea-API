import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { customFieldResponseSchema } from '@/http/schemas/tasks';
import { makeListCustomFieldsUseCase } from '@/use-cases/tasks/custom-fields/factories/make-list-custom-fields-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCustomFieldsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/custom-fields',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CUSTOM_FIELDS.ACCESS,
        resource: 'task-custom-fields',
      }),
    ],
    schema: {
      tags: ['Tasks - Custom Fields'],
      summary: 'List custom fields of a board',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      response: {
        200: z.object({ customFields: z.array(customFieldResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const { boardId } = request.params;

      const useCase = makeListCustomFieldsUseCase();
      const result = await useCase.execute({ boardId });

      return reply.status(200).send(result);
    },
  });
}
