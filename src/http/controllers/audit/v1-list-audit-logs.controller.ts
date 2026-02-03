import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListAuditLogsUseCase } from '@/use-cases/audit/factories/make-list-audit-logs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listAuditLogsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/audit-logs',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.AUDIT.LOGS.VIEW,
        resource: 'audit-logs',
      }),
    ],
    schema: {
      tags: ['Core - Audit'],
      summary: 'List audit logs with filters',
      querystring: z.object({
        userId: z.string().uuid().optional(),
        affectedUser: z.string().uuid().optional(),
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
      const {
        userId,
        affectedUser,
        action,
        entity,
        module,
        entityId,
        startDate,
        endDate,
        page,
        limit,
      } = request.query;

      // Tenant users see only their tenant's logs; super admins see all
      const tenantId = request.user.tenantId;

      const listAuditLogsUseCase = makeListAuditLogsUseCase();
      const result = await listAuditLogsUseCase.execute({
        tenantId,
        userId,
        affectedUser,
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
        userId: log.userId ? log.userId.toString() : null,
        userName: log.userName,
        userPermissionGroups: log.userPermissionGroups.map((group) => ({
          id: group.id,
          name: group.name,
          slug: group.slug,
        })),
        affectedUser: log.affectedUser,
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
