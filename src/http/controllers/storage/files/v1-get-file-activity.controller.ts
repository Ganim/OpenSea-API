import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListAuditLogsUseCase } from '@/use-cases/audit/factories/make-list-audit-logs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getFileActivityController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files/:id/activity',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Get activity log for a file',
      description:
        'Returns audit log entries for a specific file (uploads, renames, moves, deletes, version changes).',
      params: z.object({
        id: z.string().uuid(),
      }),
      querystring: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .default(20),
      }),
      response: {
        200: z.object({
          logs: z.array(
            z.object({
              id: z.string(),
              action: z.string(),
              entity: z.string(),
              description: z.string().nullable(),
              userId: z.string().nullable(),
              createdAt: z.coerce.date(),
              oldData: z.unknown().nullable(),
              newData: z.unknown().nullable(),
            }),
          ),
          meta: z.object({
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
            pages: z.number().int(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { page, limit } = request.query;

      const listAuditLogs = makeListAuditLogsUseCase();
      const {
        logs,
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages,
      } = await listAuditLogs.execute({
        tenantId,
        entity: 'STORAGE_FILE',
        entityId: id,
        page,
        limit,
      });

      return reply.status(200).send({
        logs: logs.map((log) => ({
          id: log.id.toString(),
          action: log.action,
          entity: log.entity,
          description: log.description,
          userId: log.userId?.toString() ?? null,
          createdAt: log.createdAt,
          oldData: log.oldData ?? null,
          newData: log.newData ?? null,
        })),
        meta: {
          total,
          page: currentPage,
          limit: currentLimit,
          pages: totalPages,
        },
      });
    },
  });
}
