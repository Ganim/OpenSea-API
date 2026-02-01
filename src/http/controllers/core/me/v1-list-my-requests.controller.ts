import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import type { RequestStatus } from '@/entities/requests/value-objects/request-status';
import type { RequestType } from '@/entities/requests/value-objects/request-type';
import { makeListRequestsUseCase } from '@/use-cases/requests/factories/make-list-requests-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMyRequestsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/requests',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my requests (created by me or assigned to me)',
      description:
        'Lista as solicitacoes criadas pelo usuario autenticado, com filtros por status, tipo e prioridade. Apenas solicitacoes proprias sao exibidas.',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        status: z.string().optional(),
        type: z.string().optional(),
        priority: z.string().optional(),
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
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { page, status, type } = request.query;

      const useCase = makeListRequestsUseCase();

      // List requests where user is the requester (self-service, no view all permission)
      const { requests, total, limit } = await useCase.execute({
        page,
        status: status as RequestStatus | undefined,
        type: type as RequestType | undefined,
        userId,
        hasViewAllPermission: false, // Force to only see own requests
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
