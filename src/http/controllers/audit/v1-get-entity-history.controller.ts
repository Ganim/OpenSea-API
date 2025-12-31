import { PermissionCodes } from '@/constants/rbac';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetEntityHistoryUseCase } from '@/use-cases/audit/factories/make-get-entity-history-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getEntityHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/audit-logs/history/:entity/:entityId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.AUDIT.HISTORY.VIEW,
        resource: 'audit-logs',
      }),
    ],
    schema: {
      tags: ['Core - Audit'],
      summary: 'Get complete history of an entity',
      params: z.object({
        entity: z.nativeEnum(AuditEntity),
        entityId: z.string(),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { entity, entityId } = request.params;

      const getEntityHistoryUseCase = makeGetEntityHistoryUseCase();
      const result = await getEntityHistoryUseCase.execute({
        entity,
        entityId,
      });

      return reply.status(200).send(result);
    },
  });
}
