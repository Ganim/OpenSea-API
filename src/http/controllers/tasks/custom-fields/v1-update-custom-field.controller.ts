import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  customFieldResponseSchema,
  updateCustomFieldSchema,
} from '@/http/schemas/tasks';
import { makeUpdateCustomFieldUseCase } from '@/use-cases/tasks/custom-fields/factories/make-update-custom-field-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCustomFieldController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/custom-fields/:fieldId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.BOARDS.MODIFY,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Custom Fields'],
      summary: 'Update a custom field',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        fieldId: z.string().uuid(),
      }),
      body: updateCustomFieldSchema,
      response: {
        200: z.object({ customField: customFieldResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId, fieldId } = request.params;

      try {
        const useCase = makeUpdateCustomFieldUseCase();
        const result = await useCase.execute({
          boardId,
          fieldId,
          ...request.body,
        });

        return reply.status(200).send(result);
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
