import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateRequestUseCase } from '@/use-cases/requests/factories/make-create-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/requests',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Create a new request',
      body: z.object({
        title: z.string().min(3).max(255),
        description: z.string().min(10),
        type: z.enum([
          'ACCESS_REQUEST',
          'PURCHASE_REQUEST',
          'APPROVAL_REQUEST',
          'ACTION_REQUEST',
          'CHANGE_REQUEST',
          'CUSTOM',
        ]),
        category: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        targetType: z.enum(['USER', 'GROUP']),
        targetId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        requiresApproval: z.boolean().optional(),
      }),
      response: {
        201: z.object({
          id: z.string(),
          title: z.string(),
          status: z.string(),
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeCreateRequestUseCase();

      const { request: createdRequest } = await useCase.execute({
        ...request.body,
        requesterId: userId,
        dueDate: request.body.dueDate
          ? new Date(request.body.dueDate)
          : undefined,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.REQUESTS.REQUEST_CREATE,
        entityId: createdRequest.id.toString(),
        placeholders: {
          userName,
          requestNumber: createdRequest.id.toString(),
          subject: createdRequest.title,
        },
        newData: {
          title: request.body.title,
          type: request.body.type,
          priority: request.body.priority,
        },
      });

      return reply.status(201).send({
        id: createdRequest.id.toString(),
        title: createdRequest.title,
        status: createdRequest.status,
      });
    },
  });
}
