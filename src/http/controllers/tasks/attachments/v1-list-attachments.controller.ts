import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListAttachmentsUseCase } from '@/use-cases/tasks/attachments/factories/make-list-attachments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listAttachmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/attachments',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.ACCESS,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Attachments'],
      summary: 'List attachments of a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          attachments: z.array(
            z.object({
              id: z.string().uuid(),
              cardId: z.string().uuid(),
              fileId: z.string().uuid(),
              addedBy: z.string().uuid(),
              createdAt: z.coerce.date(),
              fileName: z.string().optional().nullable(),
              fileMimeType: z.string().optional().nullable(),
              fileSizeBytes: z.number().optional().nullable(),
            }),
          ),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId, cardId } = request.params;

      try {
        const useCase = makeListAttachmentsUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          boardId,
          cardId,
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
