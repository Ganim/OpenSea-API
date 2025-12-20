import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { verifyAuditHistoryViewPermission } from '@/http/middlewares/verify-audit-permission';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeGetEntityHistoryUseCase } from '@/use-cases/audit/factories/make-get-entity-history-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getEntityHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/audit-logs/history/:entity/:entityId',
    preHandler: [verifyJwt, verifyAuditHistoryViewPermission],
    schema: {
      tags: ['Audit'],
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
