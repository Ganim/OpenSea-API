import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetRequestByIdUseCase } from '@/use-cases/requests/factories/make-get-request-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getRequestByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/requests/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Get request by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          type: z.string(),
          category: z.string().nullable(),
          status: z.string(),
          priority: z.string(),
          requesterId: z.string(),
          targetType: z.string(),
          targetId: z.string().nullable(),
          assignedToId: z.string().nullable(),
          dueDate: z.string().nullable(),
          slaDeadline: z.string().nullable(),
          submittedAt: z.string().nullable(),
          completedAt: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string(),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const useCase = makeGetRequestByIdUseCase();

      const { request: requestData } = await useCase.execute({
        requestId: request.params.id,
        userId: request.user.sub,
        hasViewAllPermission: request.user.permissions?.includes(
          'REQUESTS:VIEW_ALL',
        ),
      });

      return reply.status(200).send({
        id: requestData.id.toString(),
        title: requestData.title,
        description: requestData.description,
        type: requestData.type,
        category: requestData.category ?? null,
        status: requestData.status,
        priority: requestData.priority,
        requesterId: requestData.requesterId.toString(),
        targetType: requestData.targetType,
        targetId: requestData.targetId ?? null,
        assignedToId: requestData.assignedToId?.toString() ?? null,
        dueDate: requestData.dueDate?.toISOString() ?? null,
        slaDeadline: requestData.slaDeadline?.toISOString() ?? null,
        submittedAt: requestData.submittedAt?.toISOString() ?? null,
        completedAt: requestData.completedAt?.toISOString() ?? null,
        createdAt: requestData.createdAt.toISOString(),
        updatedAt: requestData.updatedAt.toISOString(),
      });
    },
  });
}
