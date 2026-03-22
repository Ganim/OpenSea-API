import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteCustomFieldUseCase } from '@/use-cases/tasks/custom-fields/factories/make-delete-custom-field-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCustomFieldController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/custom-fields/:fieldId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CUSTOM_FIELDS.REMOVE,
        resource: 'task-custom-fields',
      }),
    ],
    schema: {
      tags: ['Tasks - Custom Fields'],
      summary: 'Delete a custom field',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        fieldId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId, fieldId } = request.params;

      try {
        const useCase = makeDeleteCustomFieldUseCase();
        await useCase.execute({ boardId, fieldId });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
