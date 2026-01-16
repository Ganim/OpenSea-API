import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListAuditLogsUseCase } from '@/use-cases/audit/factories/make-list-audit-logs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMyAuditLogsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/audit-logs',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my audit logs',
      querystring: z.object({
        action: z.string().optional(),
        entity: z.string().optional(),
        module: z.string().optional(),
        entityId: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const {
        action,
        entity,
        module,
        entityId,
        startDate,
        endDate,
        page,
        limit,
      } = request.query;

      const listAuditLogsUseCase = makeListAuditLogsUseCase();
      const result = await listAuditLogsUseCase.execute({
        userId,
        action,
        entity,
        module,
        entityId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page,
        limit,
      });

      const logsFormatted = result.logs.map((log) => ({
        id: log.id.toString(),
        action: log.action,
        entity: log.entity,
        module: log.module,
        entityId: log.entityId,
        oldData: log.oldData,
        newData: log.newData,
        ip: log.ip,
        userAgent: log.userAgent,
        endpoint: log.endpoint,
        method: log.method,
        description: log.description,
        createdAt: log.createdAt,
      }));

      return reply.status(200).send({
        logs: logsFormatted,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    },
  });
}
