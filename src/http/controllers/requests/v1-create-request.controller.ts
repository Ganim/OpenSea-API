import { verifyJwt } from '@/http/middlewares/verify-jwt';
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
      tags: ['Requests'],
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
        targetType: z.enum(['USER', 'GROUP', 'ROLE']),
        targetId: z.string().optional(),
        targetRole: z.enum(['USER', 'ADMIN', 'MANAGER']).optional(),
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
      const useCase = makeCreateRequestUseCase();

      const { request: createdRequest } = await useCase.execute({
        ...request.body,
        requesterId: request.user.sub,
        dueDate: request.body.dueDate
          ? new Date(request.body.dueDate)
          : undefined,
      });

      return reply.status(201).send({
        id: createdRequest.id.toString(),
        title: createdRequest.title,
        status: createdRequest.status,
      });
    },
  });
}
