import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createCustomFieldSchema, customFieldResponseSchema } from '@/http/schemas/tasks';
import { makeCreateCustomFieldUseCase } from '@/use-cases/tasks/custom-fields/factories/make-create-custom-field-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCustomFieldController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/custom-fields',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.MANAGE,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Custom Fields'],
      summary: 'Create a custom field for a board',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      body: createCustomFieldSchema,
      response: {
        201: z.object({ customField: customFieldResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { boardId } = request.params;

      try {
        const useCase = makeCreateCustomFieldUseCase();
        const result = await useCase.execute({
          tenantId,
          boardId,
          ...request.body,
        });

        return reply.status(201).send(result);
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
