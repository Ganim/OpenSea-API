import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createIntegrationSchema,
  integrationResponseSchema,
} from '@/http/schemas/tasks/integration.schema';
import { makeCreateCardIntegrationUseCase } from '@/use-cases/tasks/integrations/factories/make-create-card-integration-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCardIntegrationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/integrations',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
        resource: 'task-integrations',
      }),
    ],
    schema: {
      tags: ['Tasks - Integrations'],
      summary: 'Create a card integration',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      body: createIntegrationSchema,
      response: {
        201: z.object({ integration: integrationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, cardId } = request.params;
      const { type, entityId, entityLabel } = request.body;

      try {
        const useCase = makeCreateCardIntegrationUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          userName: 'System',
          boardId,
          cardId,
          type,
          entityId,
          entityLabel,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
