import type { RequestStatus } from '@/entities/requests/value-objects/request-status';
import type { RequestType } from '@/entities/requests/value-objects/request-type';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeListRequestsUseCase } from '@/use-cases/requests/factories/make-list-requests-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listRequestsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/requests',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Requests'],
      summary: 'List requests with pagination and filters',
      querystring: z.object({
        page: z.string().optional(),
        status: z.string().optional(),
        type: z.string().optional(),
        priority: z.string().optional(),
        assignedToId: z.string().optional(),
        requesterId: z.string().optional(),
      }),
      response: {
        200: z.object({
          requests: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              type: z.string(),
              status: z.string(),
              priority: z.string(),
              requesterId: z.string(),
              assignedToId: z.string().nullable(),
              createdAt: z.string(),
            }),
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            perPage: z.number(),
            lastPage: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const useCase = makeListRequestsUseCase();

      const { requests, total, page, limit } = await useCase.execute({
        page: request.query.page ? Number.parseInt(request.query.page) : 1,
        status: request.query.status as RequestStatus | undefined,
        type: request.query.type as RequestType | undefined,
        assignedToId: request.query.assignedToId,
        requesterId: request.query.requesterId,
        userId: request.user.sub,
        userRole: request.user.role as 'ADMIN' | 'MANAGER' | 'USER',
      });

      return reply.status(200).send({
        requests: requests.map((req) => ({
          id: req.id.toString(),
          title: req.title,
          type: req.type,
          status: req.status,
          priority: req.priority,
          requesterId: req.requesterId.toString(),
          assignedToId: req.assignedToId?.toString() ?? null,
          createdAt: req.createdAt.toISOString(),
        })),
        meta: {
          total,
          page,
          perPage: limit,
          lastPage: Math.ceil(total / limit),
        },
      });
    },
  });
}
