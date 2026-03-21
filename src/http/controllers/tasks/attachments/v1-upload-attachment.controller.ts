import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUploadAttachmentUseCase } from '@/use-cases/tasks/attachments/factories/make-upload-attachment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function uploadAttachmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/attachments',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
        resource: 'task-attachments',
      }),
    ],
    schema: {
      tags: ['Tasks - Attachments'],
      summary: 'Upload an attachment to a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      body: z.object({
        fileId: z.string().uuid(),
        fileName: z.string().min(1).max(512).optional(),
      }),
      response: {
        201: z.object({
          attachment: z.object({
            id: z.string().uuid(),
            cardId: z.string().uuid(),
            fileId: z.string().uuid(),
            addedBy: z.string().uuid(),
            createdAt: z.coerce.date(),
            fileName: z.string().optional().nullable(),
            fileMimeType: z.string().optional().nullable(),
            fileSizeBytes: z.number().optional().nullable(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, cardId } = request.params;

      try {
        const useCase = makeUploadAttachmentUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          userName: 'System',
          boardId,
          cardId,
          fileId: request.body.fileId,
          fileName: request.body.fileName ?? '',
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
